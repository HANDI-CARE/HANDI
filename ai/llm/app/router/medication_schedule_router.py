from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.models.medication_schedule import MedicationSchedule
from app.schemas.database import MedicationScheduleResponse, MedicationScheduleUpdateRequest
from app.core.logger import logger

router = APIRouter()

@router.get("/medication-schedules", summary="모든 복약 일정 조회")
async def get_all_medication_schedules(
    skip: int = Query(0, ge=0, description="건너뛸 레코드 수"),
    limit: int = Query(100, ge=1, le=1000, description="조회할 레코드 수"),
    db: AsyncSession = Depends(get_db)
):
    """모든 복약 일정을 조회합니다."""
    try:
        # 먼저 테이블 구조 확인
        from sqlalchemy import text
        
        # 테이블 존재 여부 확인
        table_check = await db.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'medication_schedules'
            );
        """))
        table_exists = table_check.scalar()
        
        if not table_exists:
            logger.warning("medication_schedules table does not exist")
            return {
                "error": "medication_schedules table does not exist",
                "available_tables": []
            }
        
        # 테이블 구조 확인
        columns_result = await db.execute(text("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'medication_schedules' 
            ORDER BY ordinal_position;
        """))
        columns = columns_result.fetchall()
        
        # 모든 데이터 조회 (raw SQL 사용)
        data_result = await db.execute(text(f"SELECT * FROM medication_schedules LIMIT {limit} OFFSET {skip}"))
        schedules = data_result.fetchall()
        column_names = data_result.keys()
        
        # 결과를 딕셔너리 형태로 변환
        data = [dict(zip(column_names, row)) for row in schedules]
        
        logger.info(f"Retrieved {len(data)} medication schedules")
        return {
            "table_structure": [{"column": col[0], "type": col[1], "nullable": col[2]} for col in columns],
            "data": data,
            "count": len(data)
        }
        
    except Exception as e:
        logger.error(f"Error retrieving medication schedules: {e}")
        
        # 모든 테이블 목록 조회
        try:
            tables_result = await db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            tables = [row[0] for row in tables_result.fetchall()]
            return {
                "error": str(e),
                "available_tables": tables
            }
        except:
            return {"error": str(e), "available_tables": "Could not retrieve table list"}

@router.post("/medication_schedules", summary="복약 일정 description 업데이트")
async def update_medication_schedule_description(
    request: MedicationScheduleUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    """medication_schedules 테이블의 특정 ID에 대한 description을 업데이트합니다."""
    try:
        from sqlalchemy import text
        
        # 테이블 존재 여부 확인
        table_check = await db.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'medication_schedules'
            );
        """))
        table_exists = table_check.scalar()
        
        if not table_exists:
            logger.warning("medication_schedules table does not exist")
            raise HTTPException(status_code=404, detail="medication_schedules table does not exist")
        
        # description 컬럼 존재 여부 확인
        column_check = await db.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'medication_schedules' 
                AND column_name = 'description'
            );
        """))
        description_column_exists = column_check.scalar()
        
        if not description_column_exists:
            logger.warning("description column does not exist in medication_schedules table")
            raise HTTPException(status_code=400, detail="description column does not exist in medication_schedules table")
        
        # ID가 존재하는지 확인
        id_check = await db.execute(text("SELECT COUNT(*) FROM medication_schedules WHERE id = :id"), {"id": request.id})
        record_count = id_check.scalar()
        
        if record_count == 0:
            logger.warning(f"No record found with id {request.id}")
            raise HTTPException(status_code=404, detail=f"No record found with id {request.id}")
        
        # description 데이터 처리
        import json
        
        if isinstance(request.description, dict):
            # Dict 형태인 경우: JSON으로 변환
            description_json = json.dumps(request.description, ensure_ascii=False)
        elif isinstance(request.description, str):
            # 문자열인 경우: LLM 결과 문자열인지 확인
            try:
                # JSON 문자열인지 검증
                parsed_json = json.loads(request.description)
                description_json = request.description  # 이미 JSON 문자열
            except json.JSONDecodeError:
                # 일반 문자열인 경우: JSON 객체로 감싸기
                description_json = json.dumps({"content": request.description}, ensure_ascii=False)
        else:
            raise HTTPException(status_code=400, detail="description must be a dict or string")
        
        # description 업데이트 - JSONB 타입으로 직접 캐스팅
        from sqlalchemy.dialects.postgresql import JSONB
        from sqlalchemy import cast, literal_column
        
        # 더 안전한 방법으로 JSONB 업데이트
        update_result = await db.execute(text("""
            UPDATE medication_schedules 
            SET description = CAST(:description AS jsonb)
            WHERE id = :id
        """), {"description": description_json, "id": request.id})
        
        await db.commit()
        
        # 업데이트된 데이터 조회
        updated_data = await db.execute(text("SELECT * FROM medication_schedules WHERE id = :id"), {"id": request.id})
        updated_record = updated_data.fetchone()
        column_names = updated_data.keys()
        
        result_data = dict(zip(column_names, updated_record)) if updated_record else None
        
        logger.info(f"Updated description for medication_schedule id {request.id}")
        return {
            "success": True,
            "message": f"Successfully updated description for medication schedule with id {request.id}",
            "updated_data": result_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating medication schedule description: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update medication schedule description: {str(e)}")