"""Kokoro TTS engine wrapper.

Lazy-loads the Kokoro pipeline on first synthesis request.
Provides voice listing and audio generation.
"""

from __future__ import annotations

import io
import logging
import struct
import time
from dataclasses import dataclass

import numpy as np

from ..config import settings

logger = logging.getLogger(__name__)


# Kokoro language code mapping
LANG_CODES: dict[str, str] = {
    "en": "a",  # American English
    "en-us": "a",  # American English
    "en-gb": "b",  # British English
    "es": "e",  # Spanish
    "fr": "f",  # French
    "hi": "h",  # Hindi
    "it": "i",  # Italian
    "ja": "j",  # Japanese
    "ko": "k",  # Korean
    "pt": "p",  # Portuguese
    "zh": "z",  # Chinese
}


# Available Kokoro voices grouped by language and gender
VOICES: dict[str, dict] = {
    # American English - Female
    "af_alloy": {
        "name": "Alloy",
        "gender": "female",
        "language": "en",
        "accent": "american",
    },
    "af_aoede": {
        "name": "Aoede",
        "gender": "female",
        "language": "en",
        "accent": "american",
    },
    "af_bella": {
        "name": "Bella",
        "gender": "female",
        "language": "en",
        "accent": "american",
    },
    "af_heart": {
        "name": "Heart",
        "gender": "female",
        "language": "en",
        "accent": "american",
    },
    "af_jessica": {
        "name": "Jessica",
        "gender": "female",
        "language": "en",
        "accent": "american",
    },
    "af_nicole": {
        "name": "Nicole",
        "gender": "female",
        "language": "en",
        "accent": "american",
    },
    "af_nova": {
        "name": "Nova",
        "gender": "female",
        "language": "en",
        "accent": "american",
    },
    "af_river": {
        "name": "River",
        "gender": "female",
        "language": "en",
        "accent": "american",
    },
    "af_sarah": {
        "name": "Sarah",
        "gender": "female",
        "language": "en",
        "accent": "american",
    },
    "af_sky": {
        "name": "Sky",
        "gender": "female",
        "language": "en",
        "accent": "american",
    },
    # American English - Male
    "am_adam": {
        "name": "Adam",
        "gender": "male",
        "language": "en",
        "accent": "american",
    },
    "am_echo": {
        "name": "Echo",
        "gender": "male",
        "language": "en",
        "accent": "american",
    },
    "am_eric": {
        "name": "Eric",
        "gender": "male",
        "language": "en",
        "accent": "american",
    },
    "am_fable": {
        "name": "Fable",
        "gender": "male",
        "language": "en",
        "accent": "american",
    },
    "am_liam": {
        "name": "Liam",
        "gender": "male",
        "language": "en",
        "accent": "american",
    },
    "am_michael": {
        "name": "Michael",
        "gender": "male",
        "language": "en",
        "accent": "american",
    },
    "am_onyx": {
        "name": "Onyx",
        "gender": "male",
        "language": "en",
        "accent": "american",
    },
    # British English - Female
    "bf_alice": {
        "name": "Alice",
        "gender": "female",
        "language": "en",
        "accent": "british",
    },
    "bf_emma": {
        "name": "Emma",
        "gender": "female",
        "language": "en",
        "accent": "british",
    },
    "bf_isabella": {
        "name": "Isabella",
        "gender": "female",
        "language": "en",
        "accent": "british",
    },
    "bf_lily": {
        "name": "Lily",
        "gender": "female",
        "language": "en",
        "accent": "british",
    },
    # British English - Male
    "bm_daniel": {
        "name": "Daniel",
        "gender": "male",
        "language": "en",
        "accent": "british",
    },
    "bm_george": {
        "name": "George",
        "gender": "male",
        "language": "en",
        "accent": "british",
    },
    "bm_lewis": {
        "name": "Lewis",
        "gender": "male",
        "language": "en",
        "accent": "british",
    },
    "bm_oliver": {
        "name": "Oliver",
        "gender": "male",
        "language": "en",
        "accent": "british",
    },
}

# Singleton pipeline instance
_pipeline = None


@dataclass
class SynthesisResult:
    """Result from a TTS synthesis operation."""

    audio_bytes: bytes
    duration_ms: int
    sample_rate: int
    voice_id: str
    content_type: str


def _get_pipeline(lang_code: str = "a"):
    """Lazy-load the Kokoro pipeline."""
    global _pipeline
    if _pipeline is None:
        logger.info("Loading Kokoro pipeline (lang=%s)...", lang_code)
        start = time.monotonic()
        from kokoro import KPipeline

        _pipeline = KPipeline(lang_code=lang_code)
        elapsed = time.monotonic() - start
        logger.info("Kokoro pipeline loaded in %.1fs", elapsed)
    return _pipeline


def get_voices() -> list[dict]:
    """Return list of available voices with metadata."""
    result = []
    for voice_id, meta in VOICES.items():
        result.append(
            {
                "voice_id": voice_id,
                **meta,
            }
        )
    return result


def _numpy_to_wav(audio: np.ndarray, sample_rate: int) -> bytes:
    """Convert a float32 numpy array to WAV bytes."""
    audio = np.clip(audio, -1.0, 1.0)
    pcm = (audio * 32767).astype(np.int16)
    data = pcm.tobytes()
    data_size = len(data)

    header = io.BytesIO()
    header.write(b"RIFF")
    header.write(struct.pack("<I", 36 + data_size))
    header.write(b"WAVE")
    header.write(b"fmt ")
    header.write(struct.pack("<I", 16))
    header.write(struct.pack("<H", 1))  # PCM format
    header.write(struct.pack("<H", 1))  # mono
    header.write(struct.pack("<I", sample_rate))
    header.write(struct.pack("<I", sample_rate * 2))  # byte rate
    header.write(struct.pack("<H", 2))  # block align
    header.write(struct.pack("<H", 16))  # bits per sample
    header.write(b"data")
    header.write(struct.pack("<I", data_size))

    return header.getvalue() + data


def _wav_to_mp3(wav_bytes: bytes) -> bytes:
    """Convert WAV bytes to MP3 using pydub + ffmpeg."""
    from pydub import AudioSegment

    audio = AudioSegment.from_wav(io.BytesIO(wav_bytes))
    mp3_buf = io.BytesIO()
    audio.export(mp3_buf, format="mp3", bitrate="192k")
    return mp3_buf.getvalue()


def synthesize(
    text: str,
    voice_id: str | None = None,
    language: str | None = None,
    output_format: str = "wav",
    speed: float = 1.0,
) -> SynthesisResult:
    """Synthesize text to speech using Kokoro."""
    voice_id = voice_id or settings.default_voice
    lang_code = LANG_CODES.get(language or "en", settings.default_language)

    pipeline = _get_pipeline(lang_code)

    logger.info(
        "Synthesizing: voice=%s, lang=%s, text=%d chars", voice_id, lang_code, len(text)
    )
    start = time.monotonic()

    segments = []
    for _graphemes, _phonemes, audio_chunk in pipeline(
        text, voice=voice_id, speed=speed
    ):
        segments.append(audio_chunk)

    if not segments:
        raise ValueError("Kokoro produced no audio output")

    audio = np.concatenate(segments)
    elapsed = time.monotonic() - start

    sample_rate = settings.sample_rate
    duration_ms = int(len(audio) / sample_rate * 1000)

    logger.info(
        "Synthesis complete: %.1fs realtime, %dms audio, %.1fx speed",
        elapsed,
        duration_ms,
        (duration_ms / 1000) / elapsed if elapsed > 0 else 0,
    )

    wav_bytes = _numpy_to_wav(audio, sample_rate)

    if output_format == "mp3":
        audio_bytes = _wav_to_mp3(wav_bytes)
        content_type = "audio/mpeg"
    else:
        audio_bytes = wav_bytes
        content_type = "audio/wav"

    return SynthesisResult(
        audio_bytes=audio_bytes,
        duration_ms=duration_ms,
        sample_rate=sample_rate,
        voice_id=voice_id,
        content_type=content_type,
    )
