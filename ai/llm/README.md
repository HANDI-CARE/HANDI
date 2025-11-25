# Banchan AI API

A FastAPI application that provides Speech-to-Text (STT) and Language Model services for audio transcription and summarization.

## Setup Instructions

### For Windows

1.  **Create a virtual environment:**
    ```shell
    python -m venv handi-llm
    ```

2.  **Activate the virtual environment:**
    ```shell
    .\handi-llm\Scripts\activate
    ```

3.  **Install dependencies:**
    ```shell
    pip install -r requirements.txt
    ```

### For macOS / Linux

1.  **Create a virtual environment:**
    ```shell
    python3 -m venv handi-llm
    ```

2.  **Activate the virtual environment:**
    ```shell
    source handi-llm/bin/activate
    ```

3.  **Install dependencies:**
    ```shell
    pip install -r requirements.txt
    ```

## Running the Application

To run the FastAPI application, use the following command:

```shell
uvicorn main:app --host 0.0.0.0 --port 9091 --reload
```

## API Documentation

### STT (Speech-to-Text) APIs

#### 1. `/api/v1/stt`
- **Method**: POST
- **Description**: STT only - Transcribes audio and returns full text with timing
- **Request**: 
  - `file`: Audio file (multipart/form-data)
  - `model`: (Optional) Whisper model size - `tiny`, `base`, `small`, `medium`, `large`, `large-v2`, `large-v3` (default: `small`)
- **Response**:
  ```json
  {
    "full_text": "Transcribed text",
    "stt_duration": 1.23,
    "model_used": "small"
  }
  ```

#### 2. `/api/v1/stt-gms`
- **Method**: POST
- **Description**: STT using OpenAI Whisper via GMS API
- **Request**: 
  - `file`: Audio file (multipart/form-data)
  - `model`: (Optional) OpenAI model name (default: `whisper-1`)
- **Response**:
  ```json
  {
    "full_text": "Transcribed text",
    "stt_duration": 1.23,
    "model_used": "whisper-1"
  }
  ```
- **Configuration**: Requires `GMS_KEY` environment variable

### LLM (Language Model) APIs

#### 1. `/api/v1/llm-stuff`
- **Method**: POST
- **Description**: LLM only (Direct Stuffing) - Summarizes text and returns results with timing
- **Request**: 
  ```json
  {
    "text": "Text to summarize"
  }
  ```
- **Response**:
  ```json
  {
    "summary": "Summarized content",
    "llm_duration": 2.45
  }
  ```

#### 2. `/api/v1/llm-langchain`
- **Method**: POST
- **Description**: LLM only (LangChain Map-Reduce) - Summarizes text and returns results with timing
- **Request**: 
  ```json
  {
    "text": "Text to summarize"
  }
  ```
- **Response**:
  ```json
  {
    "summary": "Summarized content",
    "preprocessing_duration": 0.5,
    "llm_duration": 2.45
  }
  ```

### STT & LLM Combined APIs

#### 1. `/api/v1/stt-llm-stuff`
- **Method**: POST
- **Description**: STT + LLM summarization (Direct Stuffing)
- **Request**: 
  - `file`: Audio file (multipart/form-data)
  - `model`: (Optional) Whisper model size - `tiny`, `base`, `small`, `medium`, `large`, `large-v2`, `large-v3` (default: `small`)
- **Response**:
  ```json
  {
    "full_text": "Transcribed text",
    "summary": "Summarized content",
    "timings": {
      "stt_duration": 1.23,
      "preprocessing_duration": 0.0,
      "total_llm_duration": 2.45
    },
    "model_used": "small"
  }
  ```

#### 2. `/api/v1/stt-llm-stuff-gms`
- **Method**: POST
- **Description**: STT via GMS + LLM (Direct Stuffing)
- **Request**: 
  - `file`: Audio file (multipart/form-data)
  - `model`: (Optional) OpenAI model name (default: `whisper-1`)
- **Response**:
  ```json
  {
    "full_text": "Transcribed text",
    "summary": "Summarized content",
    "timings": {
      "stt_duration": 1.23,
      "preprocessing_duration": 0.0,
      "total_llm_duration": 2.45
    },
    "model_used": "whisper-1"
  }
  ```

#### 3. `/api/v1/stt-langchain`
- **Method**: POST
- **Description**: STT + LLM summarization (LangChain Map-Reduce)
- **Request**: 
  - `file`: Audio file (multipart/form-data)
  - `model`: (Optional) Whisper model size - `tiny`, `base`, `small`, `medium`, `large`, `large-v2`, `large-v3` (default: `small`)
- **Response**:
  ```json
  {
    "full_text": "Transcribed text",
    "summary": "Summarized content",
    "timings": {
      "stt_duration": 1.23,
      "preprocessing_duration": 0.5,
      "total_llm_duration": 2.45
    },
    "model_used": "small"
  }
  ```

#### 4. `/api/v1/stt-langchain-gms`
- **Method**: POST
- **Description**: STT via GMS + LLM (LangChain Map-Reduce) 
- **Request**: 
  - `file`: Audio file (multipart/form-data)
  - `model`: (Optional) OpenAI model name (default: `whisper-1`)
- **Response**:
  ```json
  {
    "full_text": "Transcribed text",
    "summary": "Summarized content",
    "timings": {
      "stt_duration": 1.23,
      "preprocessing_duration": 0.5,
      "total_llm_duration": 2.45
    },
    "model_used": "whisper-1"
  }
  ```

#### Model Selection Guide
- **tiny**: Fastest, least accurate (39 MB)
- **base**: Fast, basic accuracy (74 MB)
- **small**: Balanced speed/accuracy (244 MB) - **Default**
- **medium**: Better accuracy, slower (769 MB)
- **large**: High accuracy, slow (1550 MB)
- **large-v2**: Improved large model (1550 MB)
- **large-v3**: Latest large model (1550 MB)

**Note**: Models are cached after first load. Switching between models may cause initial loading delays.
