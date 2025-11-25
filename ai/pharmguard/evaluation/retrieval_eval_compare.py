
import os
import sys
import re
import numpy as np
from typing import List, Dict, Any, Optional, Tuple

# --- 라이브러리 의존성 확인 ---
try:
    import pandas as pd
except ImportError:
    print("오류: 'pandas' 라이브러리가 필요합니다. `pip install pandas` 명령어로 설치해주세요.")
    sys.exit(1)

# --- 프로젝트 경로 설정 ---
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from app.services.chromadb_service import get_collection_with_embedding
from app.core.config.config import CHROMADB_COLLECTION_NAME, DRUG_DETECTION_THRESHOLD

# --- 평가를 위한 설정 ---
EVAL_SAMPLE_SIZE = 5000
CSV_PATH = os.path.join(os.path.dirname(__file__), 'medicine_total_info.csv')

# --- 공통 함수: 데이터 로딩 및 파싱 ---
def parse_drug_name_for_query(original_name: str) -> Optional[str]:
    if not original_name or pd.isna(original_name):
        return None
    name = str(original_name).strip()
    if "(수출용)" in name:
        return None
    bracket_pattern = r'\([^)]*\)'
    base_name = re.sub(bracket_pattern, '', name).strip()
    return base_name

def load_test_queries_from_csv(csv_path: str, sample_size: int = None) -> List[Dict[str, Any]]:
    if not os.path.exists(csv_path):
        print(f"[오류] CSV 파일을 찾을 수 없습니다: {csv_path}")
        return []
    try:
        df = pd.read_csv(csv_path, encoding='utf-8')
        df.dropna(subset=['품목일련번호', '품목명'], inplace=True)
        df = df.drop_duplicates(subset=['품목일련번호'], keep='first')
    except Exception as e:
        print(f"[오류] CSV 파일 로드 중 오류 발생: {e}")
        return []

    full_query_list = []
    for _, row in df.iterrows():
        query = parse_drug_name_for_query(row['품목명'])
        if query:
            full_query_list.append({
                "query": query,
                "expected_id": str(row['품목일련번호']),
                "expected_name": row['품목명']
            })
    if not full_query_list:
        return []

    if sample_size and len(full_query_list) > sample_size:
        print(f"전체 {len(full_query_list)}개 데이터 중 {sample_size}개를 샘플링하여 평가합니다.")
        np.random.seed(42) # 항상 동일한 샘플을 추출하기 위해 시드 고정
        indices = np.random.choice(len(full_query_list), sample_size, replace=False)
        return [full_query_list[i] for i in indices]
    return full_query_list

def extract_dosage_info(word: str) -> Tuple[str, str]:
    dosage_units = ['마이크로그람', '마이크로그램', '밀리그람', '밀리그램', '미리그람', '밀리그', '그람', '그램', 'mcg', 'μg', 'mg', 'g', 'ML', 'ml', 'mL', 'IU', 'iu']
    dosage_pattern = r'([0-9]+(?:\.[0-9]+)?(?:/[0-9]+(?:\.[0-9]+)?)*)\s*(' + '|'.join(re.escape(unit) for unit in dosage_units) + r')'
    dosage_match = re.search(dosage_pattern, word, re.IGNORECASE)
    if dosage_match:
        dosage_value = dosage_match.group(1)
        dosage_unit = dosage_match.group(2)
        dosage = f"{dosage_value}{dosage_unit}"
        drug_name = word[:dosage_match.start()].strip()
        return (drug_name, dosage) if drug_name else (word, "")
    match = re.search(r'(\d+(?:\.\d+)?)$', word)
    if match:
        return re.sub(r'\d+(?:\.\d+)?$', '', word).strip(), match.group(1)
    return word, ""

def normalize_dosage(dosage_str: str) -> str:
    if not dosage_str: return ""
    normalized = re.sub(r'(밀리그램|밀리그람|MG)', 'mg', dosage_str, flags=re.IGNORECASE)
    normalized = re.sub(r'(그람|그램|G)', 'g', normalized, flags=re.IGNORECASE)
    return re.sub(r'\s+', '', normalized).lower()

# --- 검색 로직 A: 단순 코사인 유사도 방식 (비교군) ---
def search_logic_A(query: str, collection) -> List[Dict[str, Any]]:
    # 가장 단순한 방식: 전체 쿼리로 코사인 유사도 검색
    results = collection.query(query_texts=[query], n_results=5, include=['metadatas', 'distances'])
    if results.get('ids') and results['ids'][0]:
        return [{'id': results['ids'][0][i], 'metadata': results['metadatas'][0][i]} for i in range(len(results['ids'][0]))]
    return []

# --- 검색 로직 B: ocr_service.py 방식 ---
def calculate_dosage_similarity_B(target: str, candidate: str) -> float:
    if not target or not candidate: return 0.0
    if target == candidate: return 1.0
    target_numbers = re.findall(r'\d+(?:\.\d+)?', target)
    candidate_numbers = re.findall(r'\d+(?:\.\d+)?', candidate)
    if not target_numbers or not candidate_numbers: return 0.0
    if target_numbers[0] == candidate_numbers[0]: return 0.8
    if any(t_num in candidate_numbers for t_num in target_numbers): return 0.5
    return 0.0

def search_logic_B(query: str, collection) -> List[Dict[str, Any]]:
    drug_name, extracted_dosage = extract_dosage_info(query)
    if extracted_dosage and drug_name and drug_name != query:
        results = collection.query(query_texts=[drug_name], n_results=10, include=['metadatas', 'distances'])
        if not results.get('ids') or not results['ids'][0]: return []
        candidates = []
        for i in range(len(results['ids'][0])):
            similarity_score = 1.0 - results['distances'][0][i]
            if similarity_score >= DRUG_DETECTION_THRESHOLD:
                candidates.append({'id': results['ids'][0][i], 'score': similarity_score, 'metadata': results['metadatas'][0][i], 'dosage': results['metadatas'][0][i].get('용량', '')})
        if not candidates: return []
        target_dosage_normalized = normalize_dosage(extracted_dosage)
        
        # 각 후보에 대해 용량 매칭 점수 계산
        for candidate in candidates:
            candidate_dosage = normalize_dosage(candidate['dosage'])
            dosage_match_score = calculate_dosage_similarity_B(target_dosage_normalized, candidate_dosage)
            candidate['dosage_score'] = dosage_match_score
            candidate['composite_score'] = candidate['score'] * 0.7 + dosage_match_score * 0.3
        
        # 복합 점수로 정렬하여 Top-5 반환
        candidates.sort(key=lambda x: x['composite_score'], reverse=True)
        return candidates[:5]
    
    results = collection.query(query_texts=[query], n_results=5, include=['metadatas', 'distances'])
    if results.get('ids') and results['ids'][0]:
        result_list = []
        for i in range(len(results['ids'][0])):
            similarity_score = 1.0 - results['distances'][0][i]
            if similarity_score >= DRUG_DETECTION_THRESHOLD:
                result_list.append({'id': results['ids'][0][i], 'metadata': results['metadatas'][0][i], 'score': similarity_score})
        return result_list[:5]
    return []


# --- 메인 평가 함수 ---
def evaluate_and_compare():
    print("--- 검색 로직 비교 평가 스크립트 ---")
    test_queries = load_test_queries_from_csv(CSV_PATH, EVAL_SAMPLE_SIZE)
    if not test_queries:
        print("스크립트를 종료합니다.")
        return
    try:
        collection = get_collection_with_embedding(CHROMADB_COLLECTION_NAME)
        print(f"'{CHROMADB_COLLECTION_NAME}' 컬렉션을 성공적으로 불러왔습니다.")
    except Exception as e:
        print(f"[오류] ChromaDB 컬렉션을 불러오는 데 실패했습니다: {e}")
        return

    # Top-1 정확도
    correct_A_1, correct_B_1 = 0, 0
    # Top-5 정확도
    correct_A_5, correct_B_5 = 0, 0

    print("\n비교 평가를 시작합니다...")
    for i, item in enumerate(test_queries):
        query, expected_id = item['query'], item['expected_id']
        if (i + 1) % 10 == 0: print(f"  {i + 1}/{len(test_queries)} 쿼리 평가 진행 중...")
        
        # 로직 A 평가
        res_A = search_logic_A(query, collection)
        if res_A:
            # Top-1 및 Top-5 체크
            top1_match = res_A[0]['id'] == expected_id if len(res_A) > 0 else False
            top5_match = any(result['id'] == expected_id for result in res_A[:5])
            if top1_match: correct_A_1 += 1
            if top5_match: correct_A_5 += 1

        # 로직 B 평가
        res_B = search_logic_B(query, collection)
        if res_B:
            top1_match = res_B[0]['id'] == expected_id if len(res_B) > 0 else False
            top5_match = any(result['id'] == expected_id for result in res_B[:5])
            if top1_match: correct_B_1 += 1
            if top5_match: correct_B_5 += 1


    # Top-1 정확도 계산
    accuracy_A_1 = (correct_A_1 / len(test_queries)) * 100 if test_queries else 0
    accuracy_B_1 = (correct_B_1 / len(test_queries)) * 100 if test_queries else 0
    
    # Top-5 정확도 계산
    accuracy_A_5 = (correct_A_5 / len(test_queries)) * 100 if test_queries else 0
    accuracy_B_5 = (correct_B_5 / len(test_queries)) * 100 if test_queries else 0

    print("\n--- 최종 검색 로직 비교 결과 ---")
    print("평가 지표: Accuracy@1 (Top-1 Hit Rate), Accuracy@5 (Top-5 Hit Rate)")
    print(f"테스트 쿼리 개수: {len(test_queries)}")
    print("+------------------------------+----------------+----------------+")
    print(f"| 검색 로직                     | Accuracy@1     | Accuracy@5     |")
    print("+------------------------------+----------------+----------------+")
    print(f"| 로직 A (단순 코사인 유사도)     | {accuracy_A_1:>14.2f}% | {accuracy_A_5:>14.2f}% |")
    print(f"| 로직 B (복합 코사인 유사도)     | {accuracy_B_1:>14.2f}% | {accuracy_B_5:>14.2f}% |")
    print("+------------------------------+----------------+----------------+\n")


    print("--- 평가 완료 ---")

if __name__ == "__main__":
    evaluate_and_compare()
