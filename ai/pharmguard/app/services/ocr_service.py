"""
OCR 및 약물 탐지 관련 유틸리티 함수들
"""
import re
import os
import base64
import requests
from typing import Dict, Any, Optional, Tuple
# from google.cloud import vision  # 필요시에만 동적으로 import
from app.core.config.config import GOOGLE_VISION_API_KEY, DRUG_DETECTION_THRESHOLD
from app.schemas.medicine_total import DrugInfo

def perform_ocr_with_google_vision(image_content: bytes) -> str:
    """
    Google Vision API를 사용하여 이미지에서 텍스트를 추출합니다.
    """
    if not GOOGLE_VISION_API_KEY:
        raise Exception("Google Vision API 키가 설정되지 않았습니다")
    
    try:
        # API 키를 사용하는 경우 (REST API 방식)
        if not GOOGLE_VISION_API_KEY.endswith('.json'):
            # 이미지를 base64로 인코딩
            image_base64 = base64.b64encode(image_content).decode('utf-8')
            
            # Google Vision API REST 엔드포인트 호출
            url = f"https://vision.googleapis.com/v1/images:annotate?key={GOOGLE_VISION_API_KEY}"
            
            payload = {
                "requests": [
                    {
                        "image": {
                            "content": image_base64
                        },
                        "features": [
                            {
                                "type": "TEXT_DETECTION"
                            }
                        ]
                    }
                ]
            }
            
            response = requests.post(url, json=payload)
            response_data = response.json()
            
            if response.status_code != 200:
                raise Exception(f"Google Vision API 오류: {response_data}")
            
            # 응답에서 텍스트 추출
            if 'responses' in response_data and len(response_data['responses']) > 0:
                if 'textAnnotations' in response_data['responses'][0]:
                    return response_data['responses'][0]['textAnnotations'][0]['description']
                else:
                    return ""
            else:
                return ""
        else:
            # 서비스 계정 JSON 파일을 사용하는 경우
            from google.cloud import vision
            
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = GOOGLE_VISION_API_KEY
            client = vision.ImageAnnotatorClient()

            image = vision.Image(content=image_content)
            response = client.text_detection(image=image)
            texts = response.text_annotations

            if response.error.message:
                raise Exception(f'Google Vision API 오류: {response.error.message}')

            if texts:
                return texts[0].description  # 전체 텍스트 반환
            else:
                return ""
    
    except Exception as e:
        raise Exception(f"OCR 처리 중 오류 발생: {str(e)}")

def extract_dosage_info(word: str) -> Tuple[str, str]:
    """
    단어에서 용량 정보를 추출합니다.
    
    Returns:
        tuple: (품목명, 용량정보)
    """
    import re
    
    # 다양한 용량 패턴 정의
    dosage_patterns = [
        r'(\d+(?:\.\d+)?)\s*(?:mg|밀리그램|밀리그람|MG)',  # 80mg, 160밀리그램
        r'(\d+(?:\.\d+)?)\s*(?:g|그람|그램|G)',           # 1g, 2그람
        r'(\d+(?:\.\d+)?)\s*(?:μg|마이크로그램|MCG)',      # 100μg
        r'(\d+(?:\.\d+)?)\s*/\s*(\d+(?:\.\d+)?)',        # 5/100, 80/25
        r'(\d+(?:\.\d+)?)\s*(?:정|캡슐|알)',              # 1정, 2캡슐
    ]
    
    extracted_dosage = ""
    drug_name = word
    
    for pattern in dosage_patterns:
        match = re.search(pattern, word, re.IGNORECASE)
        if match:
            # 용량 정보 추출
            if '/' in pattern:  # 복합 용량의 경우
                extracted_dosage = f"{match.group(1)}/{match.group(2)}"
            else:
                extracted_dosage = match.group(1)
            
            # 약품명에서 용량 부분 제거
            drug_name = re.sub(pattern, '', word, flags=re.IGNORECASE).strip()
            break
    
    # 추가적으로 숫자+단위가 끝에 있는 경우 처리
    if not extracted_dosage:
        # 끝에 숫자가 있는 경우 (예: 발사르텔정80)
        match = re.search(r'(\d+(?:\.\d+)?)$', word)
        if match:
            extracted_dosage = match.group(1)
            drug_name = re.sub(r'\d+(?:\.\d+)?$', '', word).strip()
    
    return drug_name, extracted_dosage

def normalize_dosage(dosage_str: str) -> str:
    """
    용량 문자열을 정규화합니다.
    """
    if not dosage_str:
        return ""
    
    import re
    
    # mg, 밀리그램 등을 mg로 통일
    normalized = re.sub(r'(밀리그램|밀리그람|MG)', 'mg', dosage_str, flags=re.IGNORECASE)
    # g, 그람 등을 g로 통일  
    normalized = re.sub(r'(그람|그램|G)', 'g', normalized, flags=re.IGNORECASE)
    # 공백 제거
    normalized = re.sub(r'\s+', '', normalized)
    
    return normalized.lower()

def search_drug_by_word(word: str, collection) -> Optional[DrugInfo]:
    """
    단일 단어로 약품을 검색합니다.
    용량 정보가 포함된 경우 2단계 검색을 수행합니다:
    1. 품목명으로 상위 3개 검색
    2. 용량 정보로 최적 매칭 선택
    """
    try:
        # 단어 길이가 너무 짧으면 스킵
        if len(word.strip()) < 2:
            return None
        
        # 용량 정보 추출
        drug_name, extracted_dosage = extract_dosage_info(word)
        
        # 용량 정보가 있는 경우 2단계 검색
        if extracted_dosage and drug_name != word:
            return search_with_dosage_matching(drug_name, extracted_dosage, collection)
        
        # 용량 정보가 없는 경우 기존 방식으로 검색
        results = collection.query(
            query_texts=[word],
            n_results=1,
            include=['documents', 'metadatas', 'distances']
        )
        
        if results['ids'] and len(results['ids'][0]) > 0:
            similarity_score = 1.0 - results['distances'][0][0]
            
            # 임계값 이상인 경우만 약품으로 판단
            if similarity_score >= DRUG_DETECTION_THRESHOLD:
                metadata = results['metadatas'][0][0]
                return DrugInfo(
                    id=results['ids'][0][0],
                    score=round(similarity_score, 4),
                    품목명=metadata.get('품목명'),
                    상세내용=metadata.get('상세내용'),
                    용량=metadata.get('용량'),
                    원본품목명=metadata.get('원본품목명'),
                    업소명=metadata.get('업소명'),
                    성상=metadata.get('성상'),
                    의약품제형=metadata.get('의약품제형'),
                    metadata=metadata
                )
        
        return None
        
    except Exception as e:
        print(f"단어 '{word}' 검색 중 오류: {e}")
        return None

def search_with_dosage_matching(drug_name: str, target_dosage: str, collection) -> Optional[DrugInfo]:
    """
    품목명으로 상위 3개를 검색한 후, 용량 정보로 최적 매칭을 찾습니다.
    """
    try:
        # 1단계: 품목명으로 상위 3개 검색
        results = collection.query(
            query_texts=[drug_name],
            n_results=3,
            include=['documents', 'metadatas', 'distances']
        )
        
        if not results['ids'] or len(results['ids'][0]) == 0:
            return None
        
        candidates = []
        for i in range(len(results['ids'][0])):
            similarity_score = 1.0 - results['distances'][0][i]
            
            # 임계값 이상인 경우만 고려
            if similarity_score >= DRUG_DETECTION_THRESHOLD:
                metadata = results['metadatas'][0][i]
                candidates.append({
                    'id': results['ids'][0][i],
                    'score': similarity_score,
                    'metadata': metadata,
                    'dosage': metadata.get('용량', '')
                })
        
        if not candidates:
            return None
        
        # 2단계: 용량 정보로 최적 매칭 찾기
        target_dosage_normalized = normalize_dosage(target_dosage)
        best_candidate = None
        best_dosage_match_score = 0
        
        for candidate in candidates:
            candidate_dosage = normalize_dosage(candidate['dosage'])
            
            # 용량 매칭 점수 계산
            dosage_match_score = calculate_dosage_similarity(target_dosage_normalized, candidate_dosage)
            
            # 용량 매칭 점수가 높은 것을 우선 선택
            if dosage_match_score > best_dosage_match_score:
                best_dosage_match_score = dosage_match_score
                best_candidate = candidate
            # 용량 매칭 점수가 같다면 품목명 유사도가 높은 것 선택
            elif dosage_match_score == best_dosage_match_score and best_candidate:
                if candidate['score'] > best_candidate['score']:
                    best_candidate = candidate
        
        # 용량 매칭이 전혀 안되는 경우 품목명 유사도가 가장 높은 것 선택
        if best_dosage_match_score == 0:
            best_candidate = max(candidates, key=lambda x: x['score'])
        
        if best_candidate:
            metadata = best_candidate['metadata']
            return DrugInfo(
                id=best_candidate['id'],
                score=round(best_candidate['score'], 4),
                품목명=metadata.get('품목명'),
                상세내용=metadata.get('상세내용'),
                용량=metadata.get('용량'),
                원본품목명=metadata.get('원본품목명'),
                업소명=metadata.get('업소명'),
                성상=metadata.get('성상'),
                의약품제형=metadata.get('의약품제형'),
                metadata=metadata
            )
        
        return None
        
    except Exception as e:
        print(f"용량 매칭 검색 중 오류: {e}")
        return None

def calculate_dosage_similarity(target: str, candidate: str) -> float:
    """
    두 용량 정보의 유사도를 계산합니다.
    """
    if not target or not candidate:
        return 0.0
    
    # 정확히 일치하는 경우
    if target == candidate:
        return 1.0
    
    # 숫자 부분만 추출해서 비교
    import re
    target_numbers = re.findall(r'\d+(?:\.\d+)?', target)
    candidate_numbers = re.findall(r'\d+(?:\.\d+)?', candidate)
    
    if not target_numbers or not candidate_numbers:
        return 0.0
    
    # 첫 번째 숫자가 일치하는 경우 높은 점수
    if target_numbers[0] == candidate_numbers[0]:
        return 0.8
    
    # 숫자가 포함되어 있는 경우 부분 점수
    for t_num in target_numbers:
        if t_num in candidate_numbers:
            return 0.5
    
    return 0.0

def detect_drugs_from_ocr_text(ocr_text: str, collection) -> Dict[str, Any]:
    """
    OCR 텍스트에서 약품을 탐지하고 결과를 반환합니다.
    """
    # 텍스트를 공백 기준으로 분할하고 정리
    words = [word.strip() for word in ocr_text.split() if word.strip()]
    
    # 각 단어별로 약품 검색 수행
    drug_candidates = []
    detected_words = []
    
    for word in words:
        drug_info = search_drug_by_word(word, collection)
        if drug_info:
            drug_candidates.append(drug_info)
            detected_words.append(word)
    
    # 가장 높은 점수의 약품을 최선의 매치로 선택
    best_match = None
    if drug_candidates:
        best_match = max(drug_candidates, key=lambda x: x.score)
    
    # 탐지 요약 생성 및 로그 출력
    summary = f"OCR에서 {len(words)}개 단어 추출, {len(drug_candidates)}개 약품 후보 탐지"
    if best_match:
        summary += f", 최고 매치: {best_match.productName} (점수: {best_match.score})"
    
    return {
        "detected_drugs": drug_candidates,
        "detected_words": detected_words,
        "best_match": best_match,
        "detection_summary": summary
    }