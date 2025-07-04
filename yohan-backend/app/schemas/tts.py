from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class TTSRequest(BaseModel):
    """Request model for text-to-speech synthesis"""
    text: str = Field(..., description="Text to synthesize", min_length=1, max_length=5000)
    voice_id: Optional[str] = Field(None, description="Voice ID to use (defaults to Peter)")
    voice_settings: Optional[Dict[str, Any]] = Field(None, description="Voice settings override")
    use_cache: Optional[bool] = Field(True, description="Whether to use caching")
    stream: Optional[bool] = Field(False, description="Whether to stream the response")

class TTSResponse(BaseModel):
    """Response model for text-to-speech synthesis"""
    success: bool = Field(..., description="Whether the synthesis was successful")
    audio_url: Optional[str] = Field(None, description="URL to download the audio file")
    cache_hit: Optional[bool] = Field(None, description="Whether the response was served from cache")
    duration_ms: Optional[int] = Field(None, description="Time taken to synthesize in milliseconds")
    voice_id: Optional[str] = Field(None, description="Voice ID that was used")
    error: Optional[str] = Field(None, description="Error message if synthesis failed")

class TTSStreamResponse(BaseModel):
    """Response model for streaming text-to-speech"""
    success: bool = Field(..., description="Whether the stream started successfully")
    stream_url: Optional[str] = Field(None, description="WebSocket URL for audio stream")
    voice_id: Optional[str] = Field(None, description="Voice ID that will be used")
    error: Optional[str] = Field(None, description="Error message if stream failed to start")

class VoiceInfo(BaseModel):
    """Model for voice information"""
    voice_id: str = Field(..., description="Unique voice identifier")
    name: str = Field(..., description="Human-readable voice name")
    category: Optional[str] = Field(None, description="Voice category")

class VoicesResponse(BaseModel):
    """Response model for available voices"""
    success: bool = Field(..., description="Whether the request was successful")
    voices: List[VoiceInfo] = Field(..., description="List of available voices")
    default_voice_id: str = Field(..., description="Default voice ID")
    error: Optional[str] = Field(None, description="Error message if request failed")

class TTSSettingsUpdate(BaseModel):
    """Model for updating TTS settings"""
    stability: Optional[float] = Field(None, ge=0.0, le=1.0, description="Voice stability (0.0-1.0)")
    similarity_boost: Optional[float] = Field(None, ge=0.0, le=1.0, description="Similarity boost (0.0-1.0)")
    style: Optional[float] = Field(None, ge=0.0, le=1.0, description="Style influence (0.0-1.0)")
    use_speaker_boost: Optional[bool] = Field(None, description="Whether to use speaker boost")

class TTSCacheStats(BaseModel):
    """Model for TTS cache statistics"""
    cache_dir: str = Field(..., description="Cache directory path")
    total_files: int = Field(..., description="Number of cached files")
    total_size_mb: float = Field(..., description="Total cache size in MB")
    max_size_mb: float = Field(..., description="Maximum cache size in MB")
    max_age_hours: int = Field(..., description="Maximum cache age in hours")

class TTSCacheStatsResponse(BaseModel):
    """Response model for cache statistics"""
    success: bool = Field(..., description="Whether the request was successful")
    stats: Optional[TTSCacheStats] = Field(None, description="Cache statistics")
    error: Optional[str] = Field(None, description="Error message if request failed")

class TTSHealthResponse(BaseModel):
    """Response model for TTS service health check"""
    success: bool = Field(..., description="Whether the service is healthy")
    service_available: bool = Field(..., description="Whether ElevenLabs service is available")
    api_key_configured: bool = Field(..., description="Whether API key is configured")
    cache_accessible: bool = Field(..., description="Whether cache directory is accessible")
    error: Optional[str] = Field(None, description="Error message if unhealthy")

class WebSocketMessage(BaseModel):
    """WebSocket message for TTS streaming"""
    type: str = Field(..., description="Message type: 'audio_chunk', 'stream_start', 'stream_end', 'error'")
    data: Optional[bytes] = Field(None, description="Audio data for audio_chunk messages")
    text: Optional[str] = Field(None, description="Original text for stream_start messages")
    voice_id: Optional[str] = Field(None, description="Voice ID for stream_start messages")
    error: Optional[str] = Field(None, description="Error message for error messages")
    chunk_index: Optional[int] = Field(None, description="Chunk index for ordering")
    total_chunks: Optional[int] = Field(None, description="Total expected chunks")