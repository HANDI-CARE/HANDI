import warnings
import os
import uuid
import datetime
from faster_whisper import WhisperModel
from fastapi import HTTPException, UploadFile
from app.core.config.config import settings

warnings.filterwarnings("ignore", category=RuntimeWarning, module="faster_whisper")

class WhisperService:
    def __init__(self):
        self.models = {}
        self.current_model = None
        self.current_model_size = None
        self._load_default_model()
        self._ensure_temp_dir()
    
    def _load_default_model(self):
        """Load the default model on initialization."""
        self._load_model(settings.MODEL_SIZE)
    
    def _load_model(self, model_size: str):
        """Load a specific model size."""
        if model_size in self.models:
            self.current_model = self.models[model_size]
            self.current_model_size = model_size
            print(f"Using cached model: {model_size}")
            return
        
        try:
            print(f"Loading faster-whisper model: {model_size} ({settings.COMPUTE_TYPE})")
            model = WhisperModel(
                model_size, 
                device=settings.DEVICE, 
                compute_type=settings.COMPUTE_TYPE
            )
            self.models[model_size] = model
            self.current_model = model
            self.current_model_size = model_size
            print(f"Model {model_size} loaded successfully.")
        except Exception as e:
            print(f"Error loading model {model_size}: {e}")
            if not self.current_model:
                self.current_model = None
                self.current_model_size = None
    
    def _ensure_temp_dir(self):
        os.makedirs(settings.TEMP_DIR, exist_ok=True)
    
    async def transcribe_audio(self, file: UploadFile, model_size: str = None) -> tuple[str, float, str]:
        if model_size and model_size != self.current_model_size:
            self._load_model(model_size)
        
        if not self.current_model:
            raise HTTPException(status_code=503, detail="STT model is not loaded.")
        
        used_model = self.current_model_size or settings.MODEL_SIZE
        
        stt_start_time = datetime.datetime.now()
        print(f"[{stt_start_time.isoformat()}] Received request for STT: {file.filename}")
        
        temp_filename = f"{uuid.uuid4()}_{file.filename}"
        temp_filepath = os.path.join(settings.TEMP_DIR, temp_filename)

        try:
            with open(temp_filepath, "wb") as buffer:
                buffer.write(await file.read())
            
            segments, _ = self.current_model.transcribe(temp_filepath, beam_size=5, language="ko")
            text_parts = [segment.text.strip() for segment in segments]
            full_text = "\n".join(text_parts)
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"An error during transcription: {e}")
        finally:
            if os.path.exists(temp_filepath):
                os.remove(temp_filepath)
        
        stt_duration = (datetime.datetime.now() - stt_start_time).total_seconds()
        print(f"STT finished in {stt_duration:.2f} seconds.")
        
        return full_text, stt_duration, used_model

whisper_service = WhisperService()