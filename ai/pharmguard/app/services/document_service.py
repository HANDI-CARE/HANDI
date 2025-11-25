"""
문서 OCR 및 NER 처리 서비스
"""
import os
import io
import base64
from typing import List, Tuple, Optional, Dict, Any
from tempfile import NamedTemporaryFile
from PIL import Image, ImageDraw

from app.services.ocr_service import perform_ocr_with_google_vision
from app.schemas.document import WordBox, BoundingBox, DetectedEntity

# GLiNER 모델 관련
try:
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        from gliner import GLiNER
    GLINER_AVAILABLE = True
except ImportError:
    GLINER_AVAILABLE = False
    print("❌ GLiNER 라이브러리가 설치되지 않았습니다. 설치하려면: pip install gliner")


# GLiNER-ko 엔티티 라벨 한국어 매핑
GLINER_LABEL_MAPPING = {
    "PERSON": "인명",
    "LOCATION": "지명", 
    "ORGANIZATION": "기관명",
    "DATE": "날짜",
    "TIME": "시간",
    "QUANTITY": "수량",
    "ARTIFACTS": "유물/제품",
    "ANIMAL": "동물",
    "CIVILIZATION": "문명/직업", 
    "EVENT": "사건",
    "STUDY_FIELD": "학문분야",
    "MATERIAL": "재료",
    "PLANT": "식물",
    "TERM": "용어",
    "THEORY": "이론"
}

class DocumentProcessingService:
    """문서 처리 서비스 클래스"""
    
    def __init__(self):
        """서비스 초기화"""
        self.gliner_model = None
        self._load_gliner_model()
    
    def _load_gliner_model(self):
        """GLiNER-ko 모델 로딩"""
        if not GLINER_AVAILABLE:
            raise ImportError("GLiNER 라이브러리가 필요합니다. 설치하려면: pip install gliner")
        
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info("GLiNER-ko 모델 로딩 중...")
        try:
            # 모델 로딩 시 불필요한 로그 억제
            import warnings
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                self.gliner_model = GLiNER.from_pretrained("taeminlee/gliner_ko")
            
            logger.info("GLiNER-ko 모델 로드 완료")
        except Exception as e:
            raise Exception(f"GLiNER-ko 모델 로드 실패: {e}")
    
    
    
    # OCR 및 NER 처리 메서드들
    def extract_text_with_bboxes_from_image(self, image_path: str) -> Tuple[str, List[Dict]]:
        """이미지에서 텍스트와 바운딩박스를 추출"""
        try:
            with open(image_path, "rb") as img_file:
                image_content = img_file.read()
            return self.perform_ocr_with_google_vision_and_bbox(image_content)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"OCR 에러: {e}")
            return "", []
    
    def perform_ocr_with_google_vision_and_bbox(self, image_content: bytes) -> Tuple[str, List[Dict]]:
        """Google Vision API를 사용하여 텍스트와 바운딩박스 추출"""
        # 기존 ocr_service의 로직을 활용하되 바운딩박스도 함께 반환하도록 수정
        from app.core.config.config import GOOGLE_VISION_API_KEY
        import requests
        
        if not GOOGLE_VISION_API_KEY:
            raise Exception("Google Vision API 키가 설정되지 않았습니다")
        
        try:
            if not GOOGLE_VISION_API_KEY.endswith('.json'):
                image_base64 = base64.b64encode(image_content).decode('utf-8')
                url = f"https://vision.googleapis.com/v1/images:annotate?key={GOOGLE_VISION_API_KEY}"
                
                payload = {
                    "requests": [
                        {
                            "image": {"content": image_base64},
                            "features": [{"type": "TEXT_DETECTION"}]
                        }
                    ]
                }
                
                response = requests.post(url, json=payload)
                
                if response.status_code != 200:
                    raise Exception(f"Google Vision API 오류: {response.status_code} - {response.text}")
                
                result = response.json()
                
                if 'responses' in result and len(result['responses']) > 0:
                    response_data = result['responses'][0]
                    if 'textAnnotations' in response_data and response_data['textAnnotations']:
                        full_text = response_data['textAnnotations'][0]['description']
                        
                        word_annotations = []
                        for annotation in response_data['textAnnotations'][1:]:
                            if 'boundingPoly' in annotation and 'vertices' in annotation['boundingPoly']:
                                vertices = annotation['boundingPoly']['vertices']
                                word_info = {
                                    'text': annotation['description'],
                                    'bounding_box': {
                                        'x1': vertices[0].get('x', 0),
                                        'y1': vertices[0].get('y', 0),
                                        'x2': vertices[2].get('x', 0),
                                        'y2': vertices[2].get('y', 0)
                                    }
                                }
                                word_annotations.append(word_info)
                        
                        return full_text, word_annotations
                
                return "", []
            else:
                # 서비스 계정 방식 처리 (기존 로직 유지)
                from google.cloud import vision
                
                os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = GOOGLE_VISION_API_KEY
                client = vision.ImageAnnotatorClient()
                
                image = vision.Image(content=image_content)
                response = client.text_detection(image=image)
                
                if response.error.message:
                    raise Exception(f'Google Vision API 오류: {response.error.message}')
                
                if response.text_annotations:
                    full_text = response.text_annotations[0].description
                    
                    word_annotations = []
                    for annotation in response.text_annotations[1:]:
                        vertices = annotation.bounding_poly.vertices
                        word_info = {
                            'text': annotation.description,
                            'bounding_box': {
                                'x1': vertices[0].x,
                                'y1': vertices[0].y,
                                'x2': vertices[2].x,
                                'y2': vertices[2].y
                            }
                        }
                        word_annotations.append(word_info)
                    
                    return full_text, word_annotations
                else:
                    return "", []
        except Exception as e:
            raise Exception(f"OCR 처리 중 오류 발생: {str(e)}")
    
    def should_exclude_text(self, text: str) -> bool:
        """특수기호 제외 여부 판단"""
        clean_text = text.strip()
        exclude_symbols = {'(', ')', '}', '{', '[', ']', '□', '④', '③', '②', '①', '.', '+'}
        
        if len(clean_text) == 1 and clean_text in exclude_symbols:
            return True
        
        if all(char in exclude_symbols for char in clean_text):
            return True
        
        return False
    
    def match_word_to_entity(self, word_text: str, entities: List[Dict]) -> Optional[Dict]:
        """word_box의 텍스트가 엔티티에 속하는지 확인"""
        word_clean = word_text.replace(" ", "").strip()
        
        if len(word_clean) == 1 and not word_clean.isdigit():
            return None
        
        target_entities = ['PERSON', 'LOCATION', 'ARTIFACTS', 'QUANTITY']
        
        for entity in entities:
            if entity["label"] not in target_entities:
                continue
            
            entity_clean = entity["text"].replace(" ", "").strip()
            
            if word_clean == entity_clean or word_clean in entity_clean:
                return {
                    "word": entity["text"],
                    "entity": entity["label"],
                    "entity_type": entity["label"], 
                    "entity_type_ko": GLINER_LABEL_MAPPING.get(entity["label"], entity["label"]),
                    "score": float(round(entity["score"], 3))
                }
        
        return None
    
    def process_document_detection_all(self, file_data: bytes) -> List[WordBox]:
        """전체 word_boxes를 반환하되, entity에 속하는 데이터는 entity 속성 추가"""
        with NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            tmp.write(file_data)
            tmp_path = tmp.name
        
        try:
            raw_text, word_boxes = self.extract_text_with_bboxes_from_image(tmp_path)
            if not raw_text:
                raise Exception("텍스트를 추출할 수 없습니다.")
            
            labels = ["PERSON", "LOCATION", "ORGANIZATION", "DATE", "TIME", "QUANTITY",
                     "ARTIFACTS", "ANIMAL", "CIVILIZATION", "EVENT", "STUDY_FIELD",
                     "MATERIAL", "PLANT", "TERM", "THEORY"]
            
            entities = self.gliner_model.predict_entities(raw_text, labels)
            
            enriched_word_boxes = []
            
            for word_box in word_boxes:
                word_text = word_box['text']
                
                if self.should_exclude_text(word_text):
                    continue
                
                entity_match = self.match_word_to_entity(word_text, entities)
                
                bbox = BoundingBox(**word_box['bounding_box'])
                
                if entity_match:
                    detected_entity = DetectedEntity(**entity_match)
                    word_box_obj = WordBox(
                        text=word_text,
                        bounding_box=bbox,
                        detected_entity=detected_entity
                    )
                else:
                    word_box_obj = WordBox(
                        text=word_text,
                        bounding_box=bbox
                    )
                
                enriched_word_boxes.append(word_box_obj)
            
            return enriched_word_boxes
        
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    
    def process_document_detection_entities(self, file_data: bytes) -> List[WordBox]:
        """entity에 속하는 word_boxes 데이터만 반환"""
        with NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            tmp.write(file_data)
            tmp_path = tmp.name
        
        try:
            raw_text, word_boxes = self.extract_text_with_bboxes_from_image(tmp_path)
            if not raw_text:
                raise Exception("텍스트를 추출할 수 없습니다.")
            
            labels = ["PERSON", "LOCATION", "ORGANIZATION", "DATE", "TIME", "QUANTITY",
                     "ARTIFACTS", "ANIMAL", "CIVILIZATION", "EVENT", "STUDY_FIELD", 
                     "MATERIAL", "PLANT", "TERM", "THEORY"]
            
            entities = self.gliner_model.predict_entities(raw_text, labels)
            
            entity_word_boxes = []
            
            for word_box in word_boxes:
                word_text = word_box['text']
                
                if self.should_exclude_text(word_text):
                    continue
                
                entity_match = self.match_word_to_entity(word_text, entities)
                
                if entity_match:
                    bbox = BoundingBox(**word_box['bounding_box'])
                    detected_entity = DetectedEntity(**entity_match)
                    word_box_obj = WordBox(
                        text=word_text,
                        bounding_box=bbox,
                        detected_entity=detected_entity
                    )
                    entity_word_boxes.append(word_box_obj)
            
            return entity_word_boxes
        
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    
    def process_document_masking(self, file_data: bytes, word_boxes: List[WordBox]) -> bytes:
        """이미지 마스킹 처리 (파일 데이터 직접 처리)"""
        image = Image.open(io.BytesIO(file_data))
        
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        draw = ImageDraw.Draw(image)
        image_width, image_height = image.size
        
        masked_count = 0
        
        for word_box in word_boxes:
            bbox = word_box.bounding_box
            
            try:
                x1 = int(bbox.x1)
                y1 = int(bbox.y1)
                x2 = int(bbox.x2)
                y2 = int(bbox.y2)
            except (ValueError, TypeError):
                continue
            
            if x1 >= x2 or y1 >= y2:
                continue
            
            x1 = max(0, min(x1, image_width))
            y1 = max(0, min(y1, image_height))
            x2 = max(0, min(x2, image_width))
            y2 = max(0, min(y2, image_height))
            
            if x1 < x2 and y1 < y2:
                draw.rectangle([(x1, y1), (x2, y2)], fill='black')
                masked_count += 1
        
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"마스킹된 영역 수: {masked_count}")
        
        img_buffer = io.BytesIO()
        image.save(img_buffer, format='JPEG', quality=95)
        img_buffer.seek(0)
        
        return img_buffer.getvalue()

# 싱글톤 인스턴스
document_service = DocumentProcessingService()