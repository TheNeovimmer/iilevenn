from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    host: str = "0.0.0.0"
    port: int = 8000
    default_voice: str = "af_heart"
    default_language: str = "a"  # Kokoro lang code: a=American English
    sample_rate: int = 24000
    log_level: str = "info"

    class Config:
        env_prefix = "TTS_"


settings = Settings()
