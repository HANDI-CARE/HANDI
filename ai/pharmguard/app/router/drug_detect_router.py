"""
약물 탐지 관련 API 엔드포인트들
"""
from fastapi import APIRouter, HTTPException, UploadFile, File

from app.schemas.medicine_total import (
    DrugInfoBasic, DrugSummary
)
from app.services.chromadb_service import get_collection_with_embedding
from app.services.ocr_service import perform_ocr_with_google_vision, detect_drugs_from_ocr_text
from app.core.config.config import CHROMADB_COLLECTION_NAME

router = APIRouter()

@router.post("/detect-drug-from-image")
async def detect_drug_from_image(file: UploadFile = File(...)):
    """
    이미지 약품 탐지 API - 업로드된 이미지에서 OCR을 통해 약품명을 탐지하고 데이터베이스에서 매칭되는 기본 정보를 검색합니다.
    
    **처리 과정:**
    1. 업로드된 이미지 파일 검증
    2. Google Vision API를 통한 OCR 텍스트 추출
    3. 추출된 텍스트에서 약품명을 탐지하여 ChromaDB에서 검색
    4. 유사도 기반으로 매칭되는 기본 약품 정보 반환 (노인 위험 정보 제외)
    
    **지원 형식:** JPG, PNG, GIF 등
    **파일 크기 제한:** 최대 10MB
    """
    try:
        # 파일 유효성 검사
        if not file.filename:
            raise HTTPException(status_code=400, detail="파일이 업로드되지 않았습니다")
        
        # 파일 확장자 검사
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}
        file_extension = '.' + file.filename.split('.')[-1].lower()
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"지원되지 않는 파일 형식입니다. 지원 형식: {', '.join(allowed_extensions)}"
            )
        
        # 파일 크기 검사 (10MB 제한)
        file_content = await file.read()
        if len(file_content) > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(status_code=400, detail="파일 크기가 10MB를 초과합니다")
        
        # OCR 수행
        ocr_text = perform_ocr_with_google_vision(file_content)
        
        # ChromaDB 컬렉션 가져오기
        detection_collection = get_collection_with_embedding(CHROMADB_COLLECTION_NAME)
        
        # 약품 탐지 수행
        detection_result = detect_drugs_from_ocr_text(ocr_text, detection_collection)
        
        # Convert DrugInfo to DrugInfoBasic (기본 정보만, Spring 호환 형태)
        drug_info_basics = []
        drug_summaries = []
        
        for drug_info in detection_result["detected_drugs"]:
            # Spring 호환 형태로 생성 (camelCase 필드명 사용)
            basic_dto = DrugInfoBasic(
                productName=drug_info.productName or "",
                extraInfo=drug_info.extraInfo or "",
                dosage=drug_info.dosage or "",
                manufacturer=drug_info.manufacturer or "",
                appearance=drug_info.appearance or "",
                dosageForm=drug_info.dosageForm or "",
                image=drug_info.metadata.get('큰제품이미지', ''),
                category=drug_info.metadata.get('분류명', ''),
                formCodeName=drug_info.metadata.get('제형코드명', ''),
                thicknessMm=drug_info.metadata.get('크기두께', '')
            )
            drug_info_basics.append(basic_dto)
            
            # 약물 요약 정보 생성
            summary = DrugSummary(
                name=drug_info.productName or "",
                capacity=drug_info.dosage or ""
            )
            drug_summaries.append(summary)
        
        # Spring 호환 형태로 결과 변환
        spring_compatible_candidates = []
        for drug in drug_info_basics:
            spring_drug = {
                "productName": drug.productName,
                "extraInfo": drug.extraInfo,
                "dosage": drug.dosage,
                "manufacturer": drug.manufacturer,
                "appearance": drug.appearance,
                "dosageForm": drug.dosageForm,
                "image": drug.image,
                "category": drug.category,
                "formCodeName": drug.formCodeName,
                "thicknessMm": drug.thicknessMm
            }
            spring_compatible_candidates.append(spring_drug)
        
        return {
            "drug_candidates": spring_compatible_candidates,
            "drug_summary": [{"name": summary.name, "capacity": summary.capacity} for summary in drug_summaries]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"약품 탐지 중 오류 발생: {str(e)}")