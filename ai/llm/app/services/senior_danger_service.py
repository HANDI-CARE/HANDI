"""
고령자 위험 약물 서비스 - 통합된 ChromaDB 서비스 사용
"""
import chromadb
from app.core.config.config import settings
from app.services.chromadb_service import get_chroma_client, get_embedding_function

def create_senior_danger_collection():
    """고령자 위험 약물 컬렉션 생성 (통합된 한국어 임베딩 사용)"""
    client = get_chroma_client()
    embedding_function = get_embedding_function()
    
    # 기존 컬렉션 삭제
    try:
        client.delete_collection("senior_danger_medicine")
        print("✅ 기존 컬렉션 삭제 완료")
    except:
        pass
    
    # 새 컬렉션 생성
    collection = client.create_collection(
        name="senior_danger_medicine",
        embedding_function=embedding_function,
        metadata={"hnsw:space": "cosine"}
    )
    print("✅ 새 컬렉션 생성 완료 (통합된 한국어 임베딩 사용)")
    return collection

def get_senior_danger_collection():
    """고령자 위험 약물 컬렉션 반환 (통합된 한국어 임베딩 사용)"""
    client = get_chroma_client()
    embedding_function = get_embedding_function()
    
    return client.get_collection(
        "senior_danger_medicine", 
        embedding_function=embedding_function
    )

def get_senior_danger_ingredient_collection():
    """고령자 위험 약물 성분 컬렉션 반환 (통합된 한국어 임베딩 사용)"""
    client = get_chroma_client()
    embedding_function = get_embedding_function()
    
    return client.get_collection(
        "senior_danger_ingredient", 
        embedding_function=embedding_function
    )