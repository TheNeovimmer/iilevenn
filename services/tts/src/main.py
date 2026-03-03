"""iileven TTS Service — FastAPI application.

Wraps the Kokoro TTS engine behind a simple HTTP API.
The worker service calls POST /v1/synthesize to generate audio.
"""

import logging

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

from .config import settings
from .engines import kokoro

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

logger = logging.getLogger(__name__)


app = FastAPI(
    title="iileven TTS Service",
    version="0.1.0",
    description="Text-to-Speech synthesis powered by Kokoro",
)


class SynthesizeRequest(BaseModel):
    text: str = Field(
        ..., min_length=1, max_length=10000, description="Text to synthesize"
    )
    voice_id: str = Field(default="af_heart", description="Kokoro voice ID")
    language: str = Field(
        default="en", description="Language code (en, en-gb, fr, etc.)"
    )
    output_format: str = Field(
        default="wav", pattern="^(wav|mp3)$", description="Audio format"
    )
    speed: float = Field(
        default=1.0, ge=0.5, le=2.0, description="Speech speed multiplier"
    )


@app.get("/health")
async def health():
    return {"status": "ok", "service": "tts", "engines": ["kokoro"]}


@app.get("/v1/voices")
async def list_voices():
    """List all available TTS voices."""
    voices = kokoro.get_voices()
    return {"voices": voices, "total": len(voices)}


@app.post("/v1/synthesize")
async def synthesize(req: SynthesizeRequest):
    """Synthesize text to speech using Kokoro.

    Returns raw audio bytes with metadata in response headers.
    """
    try:
        result = kokoro.synthesize(
            text=req.text,
            voice_id=req.voice_id,
            language=req.language,
            output_format=req.output_format,
            speed=req.speed,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Synthesis failed")
        raise HTTPException(status_code=500, detail=f"Synthesis failed: {e}")

    return Response(
        content=result.audio_bytes,
        media_type=result.content_type,
        headers={
            "x-duration-ms": str(result.duration_ms),
            "x-sample-rate": str(result.sample_rate),
            "x-engine": "kokoro",
            "x-voice-id": result.voice_id,
        },
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
        reload=False,
        log_level=settings.log_level,
    )
