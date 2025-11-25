from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from minio import Minio
from minio.error import S3Error
from app.core.config.config import settings
from app.core.logger import logger

router = APIRouter()

def get_minio_client():
    """MinIO 클라이언트 인스턴스를 반환합니다."""
    return Minio(
        settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE
    )

@router.get("/connection-test", summary="MinIO 연결 테스트")
async def test_minio_connection():
    """MinIO 서버와의 연결을 테스트하고 버킷 목록을 반환합니다."""
    try:
        client = get_minio_client()
        
        # 버킷 목록 조회로 연결 테스트
        buckets = list(client.list_buckets())
        bucket_names = [bucket.name for bucket in buckets]
        
        logger.info(f"MinIO connection successful. Found {len(bucket_names)} buckets")
        
        return {
            "success": True,
            "message": "MinIO connection successful",
            "config": {
                "endpoint": settings.MINIO_ENDPOINT,
                "access_key": settings.MINIO_ACCESS_KEY,
                "secure": settings.MINIO_SECURE
            },
            "buckets": bucket_names,
            "bucket_count": len(bucket_names)
        }
    except Exception as e:
        logger.error(f"MinIO connection failed: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail={
                "success": False,
                "error": str(e),
                "config": {
                    "endpoint": settings.MINIO_ENDPOINT,
                    "access_key": settings.MINIO_ACCESS_KEY,
                    "secure": settings.MINIO_SECURE
                }
            }
        )

@router.get("/buckets", summary="버킷 목록 조회")
async def list_buckets():
    """모든 버킷 목록을 조회합니다."""
    try:
        client = get_minio_client()
        buckets = list(client.list_buckets())
        
        bucket_info = []
        for bucket in buckets:
            bucket_info.append({
                "name": bucket.name,
                "creation_date": bucket.creation_date.strftime("%Y-%m-%d %H:%M:%S") if bucket.creation_date else "Unknown"
            })
        
        return {
            "success": True,
            "buckets": bucket_info,
            "total_count": len(bucket_info)
        }
    except Exception as e:
        logger.error(f"Failed to list buckets: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list buckets: {str(e)}")

@router.get("/buckets/{bucket_name}/objects", summary="버킷 내 객체 목록 조회")
async def list_objects(bucket_name: str, limit: int = 100):
    """특정 버킷 내의 객체 목록을 조회합니다."""
    try:
        client = get_minio_client()
        
        # 버킷 존재 확인
        if not client.bucket_exists(bucket_name):
            raise HTTPException(status_code=404, detail=f"Bucket '{bucket_name}' not found")
        
        # 객체 목록 조회
        objects = client.list_objects(bucket_name, recursive=True)
        object_info = []
        
        count = 0
        for obj in objects:
            if count >= limit:
                break
                
            # 파일 크기 포맷팅
            size_bytes = obj.size
            if size_bytes < 1024:
                size_str = f"{size_bytes} B"
            elif size_bytes < 1024 * 1024:
                size_str = f"{size_bytes / 1024:.2f} KB"
            elif size_bytes < 1024 * 1024 * 1024:
                size_str = f"{size_bytes / (1024 * 1024):.2f} MB"
            else:
                size_str = f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"
            
            object_info.append({
                "name": obj.object_name,
                "size": size_bytes,
                "size_formatted": size_str,
                "last_modified": obj.last_modified.strftime("%Y-%m-%d %H:%M:%S") if obj.last_modified else "Unknown",
                "etag": obj.etag
            })
            count += 1
        
        return {
            "success": True,
            "bucket_name": bucket_name,
            "objects": object_info,
            "object_count": len(object_info),
            "limited_to": limit
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list objects in bucket '{bucket_name}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list objects: {str(e)}")

@router.get("/buckets/{bucket_name}/objects/{object_name:path}/info", summary="특정 파일 정보 조회")
async def get_object_info(bucket_name: str, object_name: str):
    """특정 객체의 상세 정보를 조회합니다."""
    try:
        client = get_minio_client()
        
        # 버킷 존재 확인
        if not client.bucket_exists(bucket_name):
            raise HTTPException(status_code=404, detail=f"Bucket '{bucket_name}' not found")
        
        # 객체 정보 조회
        stat = client.stat_object(bucket_name, object_name)
        
        # 파일 크기 포맷팅
        size_bytes = stat.size
        if size_bytes < 1024:
            size_str = f"{size_bytes} B"
        elif size_bytes < 1024 * 1024:
            size_str = f"{size_bytes / 1024:.2f} KB"
        elif size_bytes < 1024 * 1024 * 1024:
            size_str = f"{size_bytes / (1024 * 1024):.2f} MB"
        else:
            size_str = f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"
        
        return {
            "success": True,
            "bucket_name": bucket_name,
            "object_name": object_name,
            "exists": True,
            "size": size_bytes,
            "size_formatted": size_str,
            "last_modified": stat.last_modified.strftime("%Y-%m-%d %H:%M:%S") if stat.last_modified else "Unknown",
            "etag": stat.etag,
            "content_type": stat.content_type if hasattr(stat, 'content_type') else "Unknown",
            "metadata": stat.metadata if hasattr(stat, 'metadata') else {}
        }
    except S3Error as e:
        if e.code == 'NoSuchKey':
            return {
                "success": False,
                "bucket_name": bucket_name,
                "object_name": object_name,
                "exists": False,
                "error": "Object not found"
            }
        else:
            logger.error(f"S3Error for object '{bucket_name}/{object_name}': {str(e)}")
            raise HTTPException(status_code=500, detail=f"MinIO error: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get object info for '{bucket_name}/{object_name}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get object info: {str(e)}")