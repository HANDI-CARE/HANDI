import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # GMS API Configuration
    GMS_KEY: str = os.getenv("GMS_KEY", "")
    GMS_API_URL: str = "https://gms.ssafy.io/gmsapi/api.openai.com/v1"
    
    # Whisper Model Configuration
    MODEL_SIZE: str = "small"
    COMPUTE_TYPE: str = "int8"
    DEVICE: str = "cpu"
    
    # File Storage
    TEMP_DIR: str = "temp_audio"
    
    # LLM Configuration
    LLM_MODEL_NAME: str = "gpt-4o-mini"
    LLM_TEMPERATURE: float = 0.0
    
    # Text Processing
    CHUNK_SIZE: int = 3000
    CHUNK_OVERLAP: int = 300
    
    # RabbitMQ Configuration
    RABBITMQ_HOST: str = os.getenv("RABBITMQ_HOST", "localhost")
    RABBITMQ_PORT: int = int(os.getenv("RABBITMQ_PORT", "5672"))
    RABBITMQ_USERNAME: str = os.getenv("RABBITMQ_USERNAME", "user")
    RABBITMQ_PASSWORD: str = os.getenv("RABBITMQ_PASSWORD", "pass")
    RABBITMQ_EXCHANGE_NAME: str = os.getenv("RABBITMQ_EXCHANGE_NAME", "handi.exchange")
    RABBITMQ_QUEUE_NAME: str = os.getenv("RABBITMQ_QUEUE_NAME", "handi.queue")
    RABBITMQ_ROUTING_KEY: str = os.getenv("RABBITMQ_ROUTING_KEY", "handi.key")
    
    # ChromaDB Configuration
    CHROMADB_HOST: str = os.getenv("CHROMADB_HOST", "localhost")
    CHROMADB_PORT: int = int(os.getenv("CHROMADB_PORT", "8000"))
    CHROMADB_COLLECTION_NAME: str = os.getenv("CHROMADB_COLLECTION_NAME", "drug_information")
    EMBEDDING_MODEL_NAME: str = os.getenv("EMBEDDING_MODEL_NAME", "upskyy/bge-m3-korean")
    
    # MinIO Configuration
    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    MINIO_SECURE: bool = os.getenv("MINIO_SECURE", "false").lower() == "true"
    
    # Server Configuration (for keep-alive)
    SERVER_URL: str = os.getenv("SERVER_URL", "")  # 배포된 서버 URL (예: https://your-app.herokuapp.com)
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # LangSmith Configuration
    LANGCHAIN_TRACING_V2: str = os.getenv("LANGCHAIN_TRACING_V2", "false")
    LANGCHAIN_API_KEY: str = os.getenv("LANGCHAIN_API_KEY", "")
    LANGCHAIN_PROJECT: str = os.getenv("LANGCHAIN_PROJECT", "drug-analysis-comparison")
    
    # PostgreSQL Database Configuration
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5432"))
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "handi")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "handi")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "ssafyhandia306")

settings = Settings()