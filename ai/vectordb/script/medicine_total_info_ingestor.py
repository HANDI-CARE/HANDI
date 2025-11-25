# medicine_total_info_ingestor.py
import pandas as pd
import chromadb
from chromadb.utils import embedding_functions
import numpy as np # numpy 타입을 Python 기본 타입으로 변환하기 위해 필요
import re

# --- ChromaDB 및 임베딩 모델 설정 ---
import os
CHROMADB_HOST = os.getenv("CHROMADB_HOST", "localhost")
CHROMADB_PORT = int(os.getenv("CHROMADB_PORT", "8000"))
CHROMADB_COLLECTION_NAME = "medicine_total_info"  # 컬렉션 이름을 medicine_total_info로 변경
EMBEDDING_MODEL_NAME = "upskyy/bge-m3-korean"  # 한국어에 최적화된 임베딩 모델
# 현재 스크립트 파일의 절대 경로를 기준으로 데이터 파일 경로 설정
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DRUG_DATA_CSV_PATH = os.path.join(BASE_DIR, "..", "data", "medicine_total_info.csv")  # 사용자 요청에 따라 파일명 변경
BATCH_SIZE = 500 # 26,000개 데이터를 효율적으로 처리하기 위한 배치 크기

# 사용자 정의 임베딩 함수 정의
# ChromaDB가 이 함수를 사용하여 문서 텍스트를 벡터로 변환합니다.
class KoreanEmbeddingFunction(embedding_functions.EmbeddingFunction):
    def __init__(self, model_name: str):
        # sentence_transformers 라이브러리에서 모델을 로드합니다.
        # 이 과정에서 모델이 다운로드될 수 있습니다 (최초 실행 시).
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(model_name)
            print(f"임베딩 모델 '{model_name}' 로드 완료.")
        except Exception as e:
            print(f"임베딩 모델 로드 중 오류 발생: {e}")
            print("pip install sentence-transformers 가 제대로 되었는지 확인해주세요.")
            raise

    def __call__(self, input: chromadb.Documents) -> chromadb.Embeddings:
        # 입력된 문서 목록을 임베딩 벡터로 변환합니다.
        # convert_to_numpy=True로 설정하여 numpy 배열로 받은 후, tolist()로 Python 리스트로 변환합니다.
        # ChromaDB는 Python 리스트 형태의 임베딩을 기대합니다.
        embeddings = self.model.encode(input, convert_to_numpy=True).tolist()
        return embeddings

def parse_drug_name(original_name):
    """
    품목명을 파싱하여 품목명, 상세내용, 용량으로 분리합니다.
    
    Args:
        original_name (str): 원본 품목명
    
    Returns:
        dict: {'품목명': str, '상세내용': str, '용량': str}
    """
    if not original_name or pd.isna(original_name):
        return {'품목명': '', '상세내용': '', '용량': ''}
    
    name = str(original_name).strip()
    
    # 1. "(수출용)" 포함된 경우 스킵 (None 반환으로 표시)
    if "(수출용)" in name:
        return None
    
    # 2. 괄호 안의 내용 추출 및 연결
    bracket_contents = []
    # 괄호와 그 안의 내용을 찾아서 추출
    bracket_pattern = r'\([^)]*\)'
    brackets = re.findall(bracket_pattern, name)
    
    for bracket in brackets:
        # 괄호 제거하고 내용만 추출
        content = bracket[1:-1]  # 앞뒤 괄호 제거
        if content:  # 빈 내용이 아닌 경우만
            bracket_contents.append(content)
    
    # 괄호 내용을 "/"로 연결
    detail_content = " / ".join(bracket_contents) if bracket_contents else ""
    
    # 괄호를 모두 제거한 기본 이름
    base_name = re.sub(bracket_pattern, '', name).strip()
    
    # 3. 용량 단위 패턴 정의 (긴 단위부터 먼저 매칭되도록 정렬)
    dosage_units = [
        '마이크로그람', '마이크로그램',  # 마이크로 단위
        '밀리그람', '밀리그램', '미리그람', '밀리그',  # 밀리 단위 (한글)
        '그람', '그램',  # 그램 단위 (한글)
        'mcg', 'μg', 'mg', 'g',  # 영문/기호 단위
        'ML', 'ml', 'mL',  # 액체 단위 추가
        'IU', 'iu'  # 국제단위 추가
    ]
    
    # 용량 패턴: 숫자(소수점, / 포함 가능) + 단위
    # 예: 150밀리그램, 80/12.5밀리그램, 40mg 등
    dosage_pattern = r'([0-9]+(?:\.[0-9]+)?(?:/[0-9]+(?:\.[0-9]+)?)*)\s*(' + '|'.join(re.escape(unit) for unit in dosage_units) + r')'
    
    dosage_match = re.search(dosage_pattern, base_name, re.IGNORECASE)
    
    if dosage_match:
        # 용량 정보 추출
        dosage_value = dosage_match.group(1)
        dosage_unit = dosage_match.group(2)
        dosage = f"{dosage_value}{dosage_unit}"
        
        # 용량 부분을 제거한 나머지가 품목명
        drug_name = base_name[:dosage_match.start()].strip()
        if not drug_name:  # 품목명이 비어있으면 전체를 품목명으로
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

def ingest_drug_data_to_chromadb():
    """
    CSV 파일에서 약제 데이터를 로드하고 ChromaDB에 임베딩하여 저장합니다.
    """
    print(f"ChromaDB 서버에 연결 중: {CHROMADB_HOST}:{CHROMADB_PORT}")
    try:
        # ChromaDB 클라이언트 초기화 (Docker로 실행 중인 서버에 연결)
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
            print(f"⚠️  기존 컬렉션 '{CHROMADB_COLLECTION_NAME}' 발견. 삭제 중...")
            chroma_client.delete_collection(name=CHROMADB_COLLECTION_NAME)
            print(f"✅ 기존 컬렉션 '{CHROMADB_COLLECTION_NAME}' 삭제 완료.")
        else:
            print(f"기존 컬렉션 '{CHROMADB_COLLECTION_NAME}'이 존재하지 않습니다.")
    except Exception as e:
        print(f"기존 컬렉션 확인/삭제 중 오류 발생: {e}")
        return

    # 사용자 정의 임베딩 함수 인스턴스 생성
    # 이 단계에서 모델이 로드됩니다.
    embedding_function_instance = KoreanEmbeddingFunction(EMBEDDING_MODEL_NAME)

    # 새로운 ChromaDB 컬렉션 생성
    try:
        collection = chroma_client.create_collection(
            name=CHROMADB_COLLECTION_NAME,
            embedding_function=embedding_function_instance,
            metadata={"hnsw:space": "cosine"} # 코사인 유사도 사용 (기본값)
        )
        print(f"✅ 새로운 ChromaDB 컬렉션 '{CHROMADB_COLLECTION_NAME}' 생성 완료.")
    except Exception as e:
        print(f"ChromaDB 컬렉션 생성 실패: {e}")
        return

    # 컬렉션에 이미 데이터가 있는지 확인 및 기존 ID 세트 생성
    current_count = collection.count()
    existing_ids = set()
    
    if current_count > 0:
        print(f"컬렉션에 이미 {current_count}개의 문서가 있습니다. 기존 ID 목록을 가져와 HashSet으로 중복 확인을 수행합니다.")
        try:
            # 모든 기존 ID를 한 번에 가져와서 HashSet에 저장 (매우 빠름)
            print("기존 ID 목록 로딩 중...")
            existing_data = collection.get(include=[])  # ID만 가져오기
            existing_ids = set(existing_data['ids'])
            print(f"✅ HashSet에 기존 ID {len(existing_ids)}개 로드 완료. 이제 빠른 중복 확인이 가능합니다.")
        except Exception as e:
            print(f"기존 ID 조회 중 오류 발생: {e}")
            return
    else:
        print("컬렉션이 비어있습니다. 모든 데이터가 새로 추가됩니다.")
    
    print(f"'{DRUG_DATA_CSV_PATH}' 파일에서 데이터 로드 중...")
    try:
        # CSV 파일 읽기 (인코딩 문제 발생 시 encoding='cp949' 또는 'euc-kr' 시도)
        # 'errors=coerce'를 추가하여 인코딩 오류 발생 시 해당 문자를 대체하도록 합니다.
        df = pd.read_csv(DRUG_DATA_CSV_PATH, encoding='utf-8')
        print(f"'{DRUG_DATA_CSV_PATH}' 파일에서 총 {len(df)}개의 데이터 로드 완료.")
        
        # CSV 내부 중복된 품목일련번호 제거 (첫 번째 데이터만 유지)
        original_count = len(df)
        df = df.drop_duplicates(subset=['품목일련번호'], keep='first')
        csv_duplicates_removed = original_count - len(df)
        if csv_duplicates_removed > 0:
            print(f"CSV 내부 중복된 품목일련번호 {csv_duplicates_removed}개 제거. CSV 데이터: {len(df)}개")

    except FileNotFoundError:
        print(f"에러: '{DRUG_DATA_CSV_PATH}' 파일을 찾을 수 없습니다. 파일 경로를 확인해주세요.")
        return
    except Exception as e:
        print(f"CSV 파일을 읽는 중 오류 발생: {e}")
        print("인코딩 문제일 수 있습니다. `encoding='cp949'` 또는 `encoding='euc-kr'`로 변경하여 시도해보세요.")
        return

    # ChromaDB에 저장할 데이터 준비
    documents_to_add = []
    metadatas_to_add = []
    ids_to_add = []

    # 문서(documents)로 사용할 컬럼 목록
    document_columns = [
        '품목명', '성상', '의약품제형', '표시앞', '표시뒤', '색상앞', '색상뒤',
        '분할선앞', '분할선뒤', '표기내용앞', '표기내용뒤'
    ]

    # 메타데이터(metadatas)로 사용할 컬럼 목록 (ID로 사용되는 품목일련번호 제외)
    # '품목일련번호'는 ID로 사용되므로 메타데이터에서 제외하거나, 중복으로 포함할 수 있습니다.
    # 여기서는 ID로 사용하고 메타데이터에도 포함하여 검색 후 쉽게 접근하도록 합니다.
    metadata_columns = [
        '품목일련번호', '품목명', '업소일련번호', '업소명', '성상', '의약품제형', '큰제품이미지', '크기장축', '크기단축', '크기두께',
        '이미지생성일자(약학정보원)', '분류번호', '분류명', '전문일반구분', '품목허가일자', '제형코드명',
        '표기이미지앞', '표기이미지뒤', '표기코드앞', '표기코드뒤', '변경일자', '사업자번호'
    ]

    skipped_export_count = 0  # 수출용 스킵된 데이터 카운트
    
    for index, row in df.iterrows():
        # 0. 품목명 파싱 (수출용 체크 포함)
        original_drug_name = row.get('품목명', '')
        parsed_result = parse_drug_name(original_drug_name)
        
        # 수출용인 경우 스킵
        if parsed_result is None:
            skipped_export_count += 1
            continue
        
        # 1. 문서(document) 내용 구성
        # 검색용으로는 파싱된 품목명만 사용
        doc_parts = []
        
        # 파싱된 품목명만을 검색 문서로 사용
        if parsed_result['품목명']:
            doc_parts.append(parsed_result['품목명'])
        
        document_content = " ".join(doc_parts)
        
        # 문서 내용이 비어있으면 건너뛰기
        if not document_content:
            continue

        # 2. 메타데이터(metadata) 딕셔너리 구성
        metadata = {}
        
        # 기존 메타데이터 컬럼들 추가
        for col in metadata_columns:
            if col in row and pd.notna(row[col]):
                value = row[col]
                # numpy 타입을 Python 기본 타입으로 변환
                if isinstance(value, np.generic):
                    metadata[col] = value.item()
                else:
                    metadata[col] = value
        
        # 파싱된 품목명 정보로 기존 품목명을 덮어쓰기
        metadata['품목명'] = parsed_result['품목명']  # 파싱된 깔끔한 품목명
        metadata['상세내용'] = parsed_result['상세내용']  # 괄호 안 내용
        metadata['용량'] = parsed_result['용량']  # 용량 정보
        metadata['원본품목명'] = original_drug_name  # 원본 품목명 보존
        
        # 3. 고유 ID 생성 (품목일련번호를 ID로 사용)
        # ID는 문자열이어야 합니다.
        item_id = str(row['품목일련번호'])
        
        
        documents_to_add.append(document_content)
        metadatas_to_add.append(metadata)
        ids_to_add.append(item_id)

        if (index + 1) % 1000 == 0:
            print(f"{index + 1}개 데이터 처리 중...")

    print(f"📊 데이터 처리 완료:")
    print(f"  - 수출용 스킵: {skipped_export_count}개")
    print(f"  - 처리 완료: {len(ids_to_add)}개")
    print(f"총 {len(ids_to_add)}개의 데이터를 ChromaDB에 추가할 준비 완료.")

    # 데이터를 ChromaDB에 배치로 추가 (HashSet으로 빠른 중복 확인)
    total_batches = (len(ids_to_add) + BATCH_SIZE - 1) // BATCH_SIZE
    total_success = 0
    total_failed = 0
    
    for i in range(0, len(ids_to_add), BATCH_SIZE):
        batch_ids = ids_to_add[i:i+BATCH_SIZE]
        batch_documents = documents_to_add[i:i+BATCH_SIZE]
        batch_metadatas = metadatas_to_add[i:i+BATCH_SIZE]
        batch_num = i//BATCH_SIZE + 1
        
        # HashSet을 이용한 빠른 중복 확인
        batch_success = 0
        batch_failed = 0
        
        # 새로 추가할 데이터만 필터링 (O(1) HashSet 조회)
        new_ids = []
        new_documents = []
        new_metadatas = []
        
        for j in range(len(batch_ids)):
            if batch_ids[j] in existing_ids:
                # HashSet에서 O(1) 시간으로 중복 확인 (매우 빠름!)
                batch_failed += 1
            else:
                new_ids.append(batch_ids[j])
                new_documents.append(batch_documents[j])
                new_metadatas.append(batch_metadatas[j])
        
        # 중복되지 않은 데이터만 한 번에 추가
        if new_ids:
            try:
                collection.add(
                    documents=new_documents,
                    metadatas=new_metadatas,
                    ids=new_ids
                )
                batch_success = len(new_ids)
                # 새로 추가된 ID들을 existing_ids에 추가하여 다음 배치에서 중복 확인
                existing_ids.update(new_ids)
            except Exception as e:
                print(f"Batch {batch_num} 추가 중 오류 발생: {e}")
                batch_failed += len(new_ids)
                batch_success = 0
        
        total_success += batch_success
        total_failed += batch_failed
        
        print(f"batch {batch_num}/{total_batches} | 성공 {batch_success} | 실패 {batch_failed} | -- | 누적 데이터 {total_success}")

    print(f"\n모든 약제 데이터 ({collection.count()}개) ChromaDB 컬렉션 '{CHROMADB_COLLECTION_NAME}'에 성공적으로 삽입 완료.")

    # 데이터가 잘 들어갔는지 간단히 확인
    # print("\nChromaDB에서 몇 가지 데이터 샘플을 쿼리하여 확인:")
    # try:
    #     # 임의의 문서 ID 하나를 가져와서 확인
    #     if collection.count() > 0:
    #         sample_id = ids_to_add
    #         retrieved_data = collection.get(ids=[sample_id], include=['documents', 'metadatas'])
    #         print(f"샘플 ID: {sample_id}")
    #         print(f"문서: {retrieved_data['documents']}")
    #         print(f"메타데이터: {retrieved_data['metadatas']}")
    # except Exception as e:
    #     print(f"데이터 확인 중 오류 발생: {e}")

if __name__ == "__main__":
    ingest_drug_data_to_chromadb()