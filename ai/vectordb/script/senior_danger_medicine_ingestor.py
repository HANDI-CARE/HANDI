# senior_danger_medicine_ingestor.py
import pandas as pd
import chromadb
from chromadb.utils import embedding_functions
import numpy as np
import re

# --- ChromaDB 및 임베딩 모델 설정 ---
import os
CHROMADB_HOST = os.getenv("CHROMADB_HOST", "localhost")
CHROMADB_PORT = int(os.getenv("CHROMADB_PORT", "8000"))
CHROMADB_COLLECTION_NAME = "senior_danger_medicine"  # 새로운 컬렉션 이름
EMBEDDING_MODEL_NAME = "upskyy/bge-m3-korean"  # 한국어에 최적화된 임베딩 모델
# 현재 스크립트 파일의 절대 경로를 기준으로 데이터 파일 경로 설정
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE_PATH = os.path.join(BASE_DIR, "..", "data", "senior_danger_medicine.csv")
BATCH_SIZE = 100  # 593개 데이터에 적합한 배치 크기

# 한국어 임베딩 함수 클래스
class KoreanEmbeddingFunction(embedding_functions.EmbeddingFunction):
    def __init__(self, model_name: str):
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(model_name)
            print(f"임베딩 모델 '{model_name}' 로드 완료.")
        except Exception as e:
            print(f"임베딩 모델 로드 중 오류 발생: {e}")
            raise

    def __call__(self, input: chromadb.Documents) -> chromadb.Embeddings:
        embeddings = self.model.encode(input, convert_to_numpy=True).tolist()
        return embeddings

def parse_product_name(original_name):
    """
    제품명을 파싱하여 품목명, 상세내용, 용량으로 분리합니다.
    
    규칙:
    1. _(언더바) 뒤의 데이터는 제거
    2. 괄호 안의 내용은 "상세내용"으로 분리
    3. 용량 패턴은 "용량"으로 분리
    4. 나머지는 "품목명"으로 설정
    
    Args:
        original_name (str): 원본 제품명
    
    Returns:
        dict: {'품목명': str, '상세내용': str, '용량': str}
    """
    if not original_name or pd.isna(original_name):
        return {'품목명': '', '상세내용': '', '용량': ''}
    
    name = str(original_name).strip()
    
    # 1. 언더바(_) 뒤의 데이터 제거
    if '_' in name:
        name = name.split('_')[0].strip()
    
    # 2. 괄호 안의 내용 추출 및 연결
    bracket_contents = []
    bracket_pattern = r'\([^)]*\)'
    brackets = re.findall(bracket_pattern, name)
    
    for bracket in brackets:
        content = bracket[1:-1]  # 앞뒤 괄호 제거
        if content:
            bracket_contents.append(content)
    
    # 괄호 내용을 " / "로 연결
    detail_content = " / ".join(bracket_contents) if bracket_contents else ""
    
    # 괄호를 모두 제거한 기본 이름
    base_name = re.sub(bracket_pattern, '', name).strip()
    
    # 3. 용량 단위 패턴 정의 (drug_ingestor.py와 동일)
    dosage_units = [
        '마이크로그람', '마이크로그램',
        '밀리그람', '밀리그램', '미리그람', '밀리그',
        '그람', '그램',
        'mcg', 'μg', 'mg', 'g',
        'ML', 'ml', 'mL',
        'IU', 'iu'
    ]
    
    # 용량 패턴: 숫자(소수점, / 포함 가능) + 단위
    dosage_pattern = r'([0-9]+(?:\.[0-9]+)?(?:/[0-9]+(?:\.[0-9]+)?)*)\s*(' + '|'.join(re.escape(unit) for unit in dosage_units) + r')'
    
    dosage_match = re.search(dosage_pattern, base_name, re.IGNORECASE)
    
    if dosage_match:
        # 용량 정보 추출
        dosage_value = dosage_match.group(1)
        dosage_unit = dosage_match.group(2)
        dosage = f"{dosage_value}{dosage_unit}"
        
        # 용량 부분을 제거한 나머지가 품목명
        drug_name = base_name[:dosage_match.start()].strip()
        if not drug_name:
            drug_name = base_name
            dosage = ""
    else:
        # 용량 정보가 없는 경우
        drug_name = base_name
        dosage = ""
    
    return {
        '품목명': drug_name,
        '상세내용': detail_content,
        '용량': dosage
    }

def ingest_senior_danger_medicine_data():
    """
    senior_danger_medicine.csv 파일에서 고령자 위험 약물 데이터를 로드하고 ChromaDB에 임베딩하여 저장합니다.
    """
    print(f"ChromaDB 서버에 연결 중: {CHROMADB_HOST}:{CHROMADB_PORT}")
    try:
        # ChromaDB 클라이언트 초기화
        chroma_client = chromadb.HttpClient(host=CHROMADB_HOST, port=CHROMADB_PORT)
        print("ChromaDB 클라이언트 연결 성공.")
    except Exception as e:
        print(f"ChromaDB 서버 연결 실패: {e}")
        print("Docker 컨테이너가 실행 중인지, 포트가 올바른지 확인해주세요.")
        return

    # 기존 컬렉션이 존재하면 삭제
    try:
        existing_collections = chroma_client.list_collections()
        collection_names = [col.name for col in existing_collections]
        
        if CHROMADB_COLLECTION_NAME in collection_names:
            print(f"[주의] 기존 컬렉션 '{CHROMADB_COLLECTION_NAME}' 발견. 삭제 중...")
            chroma_client.delete_collection(name=CHROMADB_COLLECTION_NAME)
            print(f"[완료] 기존 컬렉션 '{CHROMADB_COLLECTION_NAME}' 삭제 완료.")
        else:
            print(f"기존 컬렉션 '{CHROMADB_COLLECTION_NAME}'이 존재하지 않습니다.")
    except Exception as e:
        print(f"기존 컬렉션 확인/삭제 중 오류 발생: {e}")
        return

    # 사용자 정의 임베딩 함수 인스턴스 생성
    embedding_function_instance = KoreanEmbeddingFunction(EMBEDDING_MODEL_NAME)

    # 새로운 ChromaDB 컬렉션 생성 (한국어 임베딩 함수 명시적 지정)
    try:
        collection = chroma_client.create_collection(
            name=CHROMADB_COLLECTION_NAME,
            embedding_function=embedding_function_instance,  # 한국어 모델 사용
            metadata={"hnsw:space": "cosine"}  # 코사인 유사도 사용
        )
        print(f"[완료] 새로운 ChromaDB 컬렉션 '{CHROMADB_COLLECTION_NAME}' 생성 완료.")
        print(f"[완료] 한국어 임베딩 모델 '{EMBEDDING_MODEL_NAME}' 사용 중")
    except Exception as e:
        print(f"ChromaDB 컬렉션 생성 실패: {e}")
        return

    # CSV 파일 읽기
    print(f"'{CSV_FILE_PATH}' 파일에서 데이터 로드 중...")
    
    encodings_to_try = ['euc-kr', 'cp949', 'utf-8']
    df = None
    
    for encoding in encodings_to_try:
        try:
            df = pd.read_csv(CSV_FILE_PATH, encoding=encoding)
            print(f"'{encoding}' 인코딩으로 총 {len(df)}개 데이터 로드 완료.")
            break
        except Exception as e:
            continue
    
    if df is None:
        print("에러: 모든 인코딩 시도가 실패했습니다.")
        return

    # CSV 내부 중복된 제품코드 제거
    original_count = len(df)
    df = df.drop_duplicates(subset=['제품코드'], keep='first')
    duplicates_removed = original_count - len(df)
    if duplicates_removed > 0:
        print(f"CSV 내부 중복된 제품코드 {duplicates_removed}개 제거. 처리할 데이터: {len(df)}개")

    # ChromaDB에 저장할 데이터 준비
    documents_to_add = []
    metadatas_to_add = []
    ids_to_add = []

    # 메타데이터로 사용할 컬럼 목록 (공고일자 제외)
    metadata_columns = ['성분명', '성분코드', '제품코드', '제품명', '업체명', '공고번호', '급여구분', '약품상세정보']

    for index, row in df.iterrows():
        # 제품명 파싱
        original_product_name = row.get('제품명', '')
        parsed_result = parse_product_name(original_product_name)
        
        # 문서 내용 구성 (검색용)
        document_content = parsed_result['품목명'] if parsed_result['품목명'] else original_product_name
        
        if not document_content:
            continue

        # 메타데이터 딕셔너리 구성
        metadata = {}
        
        # 기존 메타데이터 컬럼들 추가
        for col in metadata_columns:
            if col in row and pd.notna(row[col]):
                value = row[col]
                if isinstance(value, np.generic):
                    metadata[col] = value.item()
                else:
                    metadata[col] = value
        
        # 파싱된 정보 추가
        metadata['품목명'] = parsed_result['품목명']
        metadata['상세내용'] = parsed_result['상세내용']
        metadata['용량'] = parsed_result['용량']
        metadata['원본제품명'] = original_product_name
        
        # 고유 ID 생성 (제품코드 사용)
        item_id = str(row.get('제품코드', f'senior_{index}'))
        
        documents_to_add.append(document_content)
        metadatas_to_add.append(metadata)
        ids_to_add.append(item_id)

        if (index + 1) % 100 == 0:
            print(f"{index + 1}개 데이터 처리 중...")

    print(f"총 {len(ids_to_add)}개의 데이터를 ChromaDB에 추가할 준비 완료.")

    # 데이터를 ChromaDB에 배치로 추가
    total_batches = (len(ids_to_add) + BATCH_SIZE - 1) // BATCH_SIZE
    total_success = 0
    
    for i in range(0, len(ids_to_add), BATCH_SIZE):
        batch_ids = ids_to_add[i:i+BATCH_SIZE]
        batch_documents = documents_to_add[i:i+BATCH_SIZE]
        batch_metadatas = metadatas_to_add[i:i+BATCH_SIZE]
        batch_num = i//BATCH_SIZE + 1
        
        try:
            collection.add(
                documents=batch_documents,
                metadatas=batch_metadatas,
                ids=batch_ids
            )
            total_success += len(batch_ids)
            print(f"batch {batch_num}/{total_batches} | 성공 {len(batch_ids)} | 누적 데이터 {total_success}")
        except Exception as e:
            print(f"Batch {batch_num} 추가 중 오류 발생: {e}")

    print(f"\n모든 고령자 위험 약물 데이터 ({collection.count()}개) ChromaDB 컬렉션 '{CHROMADB_COLLECTION_NAME}'에 성공적으로 삽입 완료.")

if __name__ == "__main__":
    ingest_senior_danger_medicine_data()