from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from typing import List
from app.core.database import get_db
from app.models.meeting_match import MeetingMatch
from app.schemas.database import MeetingMatchResponse, MeetingMatchUpdateRequest
from app.core.logger import logger

router = APIRouter()

@router.get("/meeting-matches", summary="모든 미팅 매치 조회")
async def get_all_meeting_matches(
    skip: int = Query(0, ge=0, description="건너뛸 레코드 수"),
    limit: int = Query(100, ge=1, le=1000, description="조회할 레코드 수"),
    db: AsyncSession = Depends(get_db)
):
    """모든 미팅 매치를 조회합니다."""
    try:
        # 먼저 테이블 존재 여부 확인
        table_check = await db.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'meeting_matches'
            );
        """))
        table_exists = table_check.scalar()
        
        if not table_exists:
            logger.warning("meeting_matches table does not exist")
            return {
                "error": "meeting_matches table does not exist",
                "available_tables": []
            }
        
        # 테이블 구조 확인
        columns_result = await db.execute(text("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'meeting_matches' 
            ORDER BY ordinal_position;
        """))
        columns = columns_result.fetchall()
        
        # 모든 데이터 조회 (raw SQL 사용)
        data_result = await db.execute(text(f"SELECT * FROM meeting_matches LIMIT {limit} OFFSET {skip}"))
        matches = data_result.fetchall()
        column_names = data_result.keys()
        
        # 결과를 딕셔너리 형태로 변환
        data = [dict(zip(column_names, row)) for row in matches]
        
        logger.info(f"Retrieved {len(data)} meeting matches")
        return {
            "table_structure": [{"column": col[0], "type": col[1], "nullable": col[2]} for col in columns],
            "data": data,
            "count": len(data)
        }
        
    except Exception as e:
        logger.error(f"Error retrieving meeting matches: {e}")
        
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

@router.post("/meeting_matches/{meeting_match_id}", summary="미팅 매치 content 업데이트")
async def update_meeting_match_content(
    meeting_match_id: int,
    request: MeetingMatchUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    """meeting_matches 테이블의 특정 ID에 대한 content를 업데이트합니다."""
    try:
        # 테이블 존재 여부 확인
        table_check = await db.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'meeting_matches'
            );
        """))
        table_exists = table_check.scalar()
        
        if not table_exists:
            logger.warning("meeting_matches table does not exist")
            raise HTTPException(status_code=404, detail="meeting_matches table does not exist")
        
        # content 컬럼 존재 여부 확인
        column_check = await db.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'meeting_matches' 
                AND column_name = 'content'
            );
        """))
        content_column_exists = column_check.scalar()
        
        if not content_column_exists:
            logger.warning("content column does not exist in meeting_matches table")
            raise HTTPException(status_code=400, detail="content column does not exist in meeting_matches table")
        
        # ID가 존재하는지 확인
        id_check = await db.execute(text("SELECT COUNT(*) FROM meeting_matches WHERE id = :id"), {"id": meeting_match_id})
        record_count = id_check.scalar()
        
        if record_count == 0:
            logger.warning(f"No record found with id {meeting_match_id}")
            raise HTTPException(status_code=404, detail=f"No record found with id {meeting_match_id}")
        
        # content 데이터 처리 - 단순 문자열
        content_string = request.content
        
        # content 업데이트
        update_result = await db.execute(text("""
            UPDATE meeting_matches 
            SET content = :content
            WHERE id = :id
        """), {"content": content_string, "id": meeting_match_id})
        
        await db.commit()
        
        # 업데이트된 데이터 조회
        updated_data = await db.execute(text("SELECT * FROM meeting_matches WHERE id = :id"), {"id": meeting_match_id})
        updated_record = updated_data.fetchone()
        column_names = updated_data.keys()
        
        result_data = dict(zip(column_names, updated_record)) if updated_record else None
        
        logger.info(f"Updated content for meeting_match id {meeting_match_id}")
        return {
            "success": True,
            "message": f"Successfully updated content for meeting match with id {meeting_match_id}",
            "updated_data": result_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating meeting match content: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update meeting match content: {str(e)}")