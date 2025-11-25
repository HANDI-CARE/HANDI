# senior_danger_ingredient_ingestor.py
import pandas as pd
import chromadb
from chromadb.utils import embedding_functions
import numpy as np
import os

# --- ChromaDB 및 임베딩 모델 설정 ---
CHROMADB_HOST = os.getenv("CHROMADB_HOST", "localhost")
CHROMADB_PORT = int(os.getenv("CHROMADB_PORT", "8000"))
CHROMADB_COLLECTION_NAME = "senior_danger_ingredient"  # 새로운 컬렉션 이름
EMBEDDING_MODEL_NAME = "upskyy/bge-m3-korean"  # 한국어에 최적화된 임베딩 모델
# 현재 스크립트 파일의 절대 경로를 기준으로 데이터 파일 경로 설정
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE_PATH = os.path.join(BASE_DIR, "..", "data", "senior_danger_ingredient.csv")
BATCH_SIZE = 50  # 108개 데이터에 적합한 배치 크기

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

def ingest_senior_danger_ingredient_data():
    """
    senior_danger_ingredient.csv 파일에서 고령자 위험 성분 데이터를 로드하고 ChromaDB에 임베딩하여 저장합니다.
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
    
    encodings_to_try = ['utf-8-sig', 'utf-8', 'euc-kr', 'cp949']
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

    # CSV 내부 중복된 DUR성분코드 제거
    original_count = len(df)
    df = df.drop_duplicates(subset=['DUR성분코드'], keep='first')
    duplicates_removed = original_count - len(df)
    if duplicates_removed > 0:
        print(f"CSV 내부 중복된 DUR성분코드 {duplicates_removed}개 제거. 처리할 데이터: {len(df)}개")

    # ChromaDB에 저장할 데이터 준비
    documents_to_add = []
    metadatas_to_add = []
    ids_to_add = []

    for index, row in df.iterrows():
        # Document는 DUR성분명으로 설정
        document_content = row.get('DUR성분명', '')
        
        if not document_content or pd.isna(document_content):
            continue

        # 메타데이터 딕셔너리 구성
        metadata = {}
        
        # 요청된 메타데이터 필드들
        metadata_fields = ['DUR성분명', 'DUR성분명영문', '복합제', '관계성분', '금기내용']
        
        for field in metadata_fields:
            if field in row and pd.notna(row[field]):
                value = row[field]
                if isinstance(value, np.generic):
                    metadata[field] = value.item()
                else:
                    # 문자열 타입으로 변환 (ChromaDB 호환성)
                    metadata[field] = str(value) if value != '' else ''
            else:
                metadata[field] = ''
        
        # 추가적으로 유용한 메타데이터
        if 'DUR성분코드' in row and pd.notna(row['DUR성분코드']):
            metadata['DUR성분코드'] = str(row['DUR성분코드'])
        
        if 'DUR유형' in row and pd.notna(row['DUR유형']):
            metadata['DUR유형'] = str(row['DUR유형'])
            
        if '제형' in row and pd.notna(row['제형']):
            metadata['제형'] = str(row['제형'])
        
        # 고유 ID 생성 (DUR성분코드 사용)
        item_id = str(row.get('DUR성분코드', f'ingredient_{index}'))
        
        documents_to_add.append(str(document_content))
        metadatas_to_add.append(metadata)
        ids_to_add.append(item_id)

        if (index + 1) % 50 == 0:
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

    print(f"\n모든 고령자 위험 성분 데이터 ({collection.count()}개) ChromaDB 컬렉션 '{CHROMADB_COLLECTION_NAME}'에 성공적으로 삽입 완료.")

if __name__ == "__main__":
    ingest_senior_danger_ingredient_data()