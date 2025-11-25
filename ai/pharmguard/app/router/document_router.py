"""
문서 OCR 및 NER 관련 API 엔드포인트들
"""
from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse, Response
import json
import base64

from app.schemas.document import (
    DocumentDetectionResponse,
    MaskingRequest,
    MaskingResponse,
    ErrorResponse,
    WordBox
)
from app.services.document_service import document_service

router = APIRouter()

@router.post("/detect-all-from-image", response_model=DocumentDetectionResponse)
async def detect_all_from_image(file: UploadFile = File(...)):
    """
    이미지에서 모든 텍스트와 개체명을 탐지하는 API
    
    **기능:**
    - Google Vision API를 이용한 OCR 수행
    - GLiNER-ko 모델을 이용한 한국어 개체명 인식 (NER)
    - 전체 word_boxes 반환하되, entity에 속하는 데이터는 entity 속성 추가
    
    **입력:**
    - 이미지 파일 (JPG, PNG 등)
    
    **출력:**
    - word_boxes: 탐지된 모든 단어 박스 목록
      - text: 인식된 텍스트
      - bounding_box: 바운딩박스 좌표 (x1, y1, x2, y2)
      - detected_entity: 개체명이 탐지된 경우 해당 정보 포함
    
    **개체명 인식 대상:**
    - PERSON (인명)
    - LOCATION (지명)
    - ARTIFACTS (유물/제품)
    - QUANTITY (수량)
    
    **응답 예시:**
    ```json
    {
        "word_boxes": [
            {
                "text": "홍길동",
                "bounding_box": {"x1": 100, "y1": 200, "x2": 150, "y2": 230},
                "detected_entity": {
                    "word": "홍길동",
                    "entity": "PERSON",
                    "entity_type": "PERSON",
                    "entity_type_ko": "인명",
                    "score": 0.95
                }
            },
            {
                "text": "안녕하세요",
                "bounding_box": {"x1": 160, "y1": 200, "x2": 220, "y2": 230}
            }
        ]
    }
    ```
    """
    try:
        # 파일 데이터 읽기
        file_data = await file.read()
        
        # 문서 처리 서비스 호출
        word_boxes = document_service.process_document_detection_all(file_data)
        
        return DocumentDetectionResponse(
            word_boxes=word_boxes
        )
        
    except Exception as e:
        return JSONResponse(
            status_code=500, 
            content={"error": f"처리 중 오류 발생: {str(e)}"}
        )

@router.post("/detect-entities-from-image", response_model=DocumentDetectionResponse)
async def detect_entities_from_image(file: UploadFile = File(...)):
    """
    이미지에서 개체명이 포함된 텍스트만 탐지하는 API
    
    **기능:**
    - Google Vision API를 이용한 OCR 수행
    - GLiNER-ko 모델을 이용한 한국어 개체명 인식 (NER)
    - 개체명이 탐지된 word_boxes만 반환
    
    **입력:**
    - 이미지 파일 (JPG, PNG 등)
    
    **출력:**
    - word_boxes: 개체명이 탐지된 단어 박스 목록만
    
    **개체명 인식 대상:**
    - PERSON (인명) - 사람 이름
    - LOCATION (지명) - 장소, 주소
    - ARTIFACTS (유물/제품) - 제품명, 물건
    - QUANTITY (수량) - 숫자, 금액
    
    **응답 예시:**
    ```json
    {
        "word_boxes": [
            {
                "text": "홍길동",
                "bounding_box": {"x1": 100, "y1": 200, "x2": 150, "y2": 230},
                "detected_entity": {
                    "word": "홍길동",
                    "entity": "PERSON",
                    "entity_type": "PERSON", 
                    "entity_type_ko": "인명",
                    "score": 0.95
                }
            }
        ]
    }
    ```
    """
    try:
        # 파일 데이터 읽기
        file_data = await file.read()
        
        # 문서 처리 서비스 호출
        entity_word_boxes = document_service.process_document_detection_entities(file_data)
        
        return DocumentDetectionResponse(
            word_boxes=entity_word_boxes
        )
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"처리 중 오류 발생: {str(e)}"}
        )

@router.post("/mask-image")
async def mask_image(
    file: UploadFile = File(...),
    word_boxes: str = Form(...)
):
    """
    문서 이미지에서 지정된 텍스트 영역을 마스킹하는 API
    
    **기능:**
    - 업로드된 이미지 파일을 직접 처리
    - 지정된 바운딩박스 영역을 검정색으로 마스킹
    - 마스킹된 이미지를 바이너리 파일로 즉시 반환
    
    **입력 (multipart/form-data):**
    - file: 마스킹할 이미지 파일 (JPG, PNG 등)
    - word_boxes: 마스킹할 단어 박스 목록 (JSON 문자열)
      - text: 마스킹할 텍스트
      - bounding_box: 마스킹할 영역의 좌표 (x1, y1, x2, y2)
      - detected_entity: 탐지된 엔티티 정보 (선택사항)
    
    **출력:**
    - 마스킹된 이미지 파일 (image/jpeg)
    
    **요청 예시 (multipart/form-data):**
    ```
    file: [이미지 파일]
    word_boxes: '[
        {
            "text": "홍길동",
            "bounding_box": {"x1": 100, "y1": 200, "x2": 150, "y2": 230},
            "detected_entity": {
                "word": "홍길동",
                "entity": "PERSON",
                "entity_type": "PERSON",
                "entity_type_ko": "인명",
                "score": 0.999
            }
        },
        {
            "text": "1234567890", 
            "bounding_box": {"x1": 200, "y1": 250, "x2": 300, "y2": 280}
        }
    ]'
    ```
    
    **응답:**
    - Content-Type: image/jpeg
    - Content-Disposition: attachment; filename=masked_image.jpg
    
    **사용 시나리오:**
    1. /detect-all-from-image 또는 /detect-entities-from-image로 텍스트 탐지
    2. 클라이언트에서 마스킹할 영역 선택
    3. 원본 이미지 파일과 선택된 word_boxes JSON을 multipart로 전송
    4. 마스킹된 이미지 파일을 즉시 다운로드하여 사용
    """
    try:
        # 파일 데이터 읽기
        file_data = await file.read()
        
        # word_boxes JSON 파싱
        try:
            word_boxes_data = json.loads(word_boxes)
            word_boxes_list = [WordBox(**box) for box in word_boxes_data]
        except (json.JSONDecodeError, ValueError) as e:
            return JSONResponse(
                status_code=400,
                content={"error": f"word_boxes JSON 파싱 오류: {str(e)}"}
            )
        
        # 문서 마스킹 서비스 호출
        masked_image_data = document_service.process_document_masking(
            file_data, 
            word_boxes_list
        )
        
        # 마스킹된 이미지를 바이너리로 반환
        return Response(
            content=masked_image_data,
            media_type="image/jpeg",
            headers={"Content-Disposition": "attachment; filename=masked_image.jpg"}
        )
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"이미지 마스킹 중 오류 발생: {str(e)}"}
        )