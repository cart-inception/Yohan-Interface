import logging
import time
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Response
from fastapi.responses import StreamingResponse
from typing import Dict, Any
import asyncio
import json
import base64

from ..schemas.tts import (
    TTSRequest, TTSResponse, TTSStreamResponse, VoicesResponse, 
    TTSCacheStatsResponse, TTSHealthResponse, WebSocketMessage
)
from ..services.tts_service import tts_service

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/tts", tags=["tts"])

@router.get("/health", response_model=TTSHealthResponse)
async def get_tts_health():
    """Check TTS service health"""
    try:
        service_available = tts_service.is_available()
        cache_stats = tts_service.get_cache_stats()
        cache_accessible = "error" not in cache_stats
        
        return TTSHealthResponse(
            success=True,
            service_available=service_available,
            api_key_configured=service_available,  # If service is available, API key is configured
            cache_accessible=cache_accessible
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return TTSHealthResponse(
            success=False,
            service_available=False,
            api_key_configured=False,
            cache_accessible=False,
            error=str(e)
        )

@router.get("/voices", response_model=VoicesResponse)
async def get_voices(force_refresh: bool = False):
    """Get available voices from ElevenLabs"""
    try:
        if not tts_service.is_available():
            raise HTTPException(
                status_code=503, 
                detail="TTS service not available. Check API key configuration."
            )
        
        voices = await tts_service.get_available_voices(force_refresh=force_refresh)
        default_voice_id = tts_service.get_default_voice_id()
        
        return VoicesResponse(
            success=True,
            voices=voices,
            default_voice_id=default_voice_id
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get voices: {e}")
        return VoicesResponse(
            success=False,
            voices=[],
            default_voice_id=tts_service.get_default_voice_id(),
            error=str(e)
        )

@router.post("/synthesize", response_model=TTSResponse)
async def synthesize_text(request: TTSRequest):
    """Synthesize text to speech"""
    start_time = time.time()
    
    try:
        if not tts_service.is_available():
            raise HTTPException(
                status_code=503, 
                detail="TTS service not available. Check API key configuration."
            )
        
        # Synthesize speech
        audio_data = await tts_service.synthesize_speech(
            text=request.text,
            voice_id=request.voice_id,
            voice_settings=request.voice_settings,
            use_cache=request.use_cache
        )
        
        if audio_data is None:
            raise HTTPException(
                status_code=500,
                detail="Failed to synthesize speech. Check service logs for details."
            )
        
        # For now, we'll return the audio data as base64 in the response
        # In a production setup, you might want to save to a temporary file and return a URL
        duration_ms = int((time.time() - start_time) * 1000)
        
        # Encode audio data as base64 for JSON response
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        
        return TTSResponse(
            success=True,
            audio_url=f"data:audio/mp3;base64,{audio_base64}",
            cache_hit=None,  # We could enhance this by checking if it came from cache
            duration_ms=duration_ms,
            voice_id=request.voice_id or tts_service.get_default_voice_id()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to synthesize text: {e}")
        return TTSResponse(
            success=False,
            error=str(e)
        )

@router.post("/synthesize/stream", response_model=TTSStreamResponse)
async def start_stream_synthesis(request: TTSRequest):
    """Start streaming text-to-speech synthesis"""
    try:
        if not tts_service.is_available():
            raise HTTPException(
                status_code=503, 
                detail="TTS service not available. Check API key configuration."
            )
        
        # For streaming, client should connect to WebSocket endpoint
        return TTSStreamResponse(
            success=True,
            stream_url="/ws/tts",
            voice_id=request.voice_id or tts_service.get_default_voice_id()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start stream synthesis: {e}")
        return TTSStreamResponse(
            success=False,
            error=str(e)
        )

@router.get("/cache/stats", response_model=TTSCacheStatsResponse)
async def get_cache_stats():
    """Get TTS cache statistics"""
    try:
        stats = tts_service.get_cache_stats()
        
        if "error" in stats:
            return TTSCacheStatsResponse(
                success=False,
                error=stats["error"]
            )
        
        return TTSCacheStatsResponse(
            success=True,
            stats=stats
        )
        
    except Exception as e:
        logger.error(f"Failed to get cache stats: {e}")
        return TTSCacheStatsResponse(
            success=False,
            error=str(e)
        )

@router.delete("/cache")
async def clear_cache():
    """Clear TTS cache"""
    try:
        # This would need to be implemented in the TTS service
        # For now, return a not implemented response
        raise HTTPException(
            status_code=501,
            detail="Cache clearing not yet implemented"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to clear cache: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket endpoint for streaming TTS
@router.websocket("/ws")
async def websocket_tts_endpoint(websocket: WebSocket):
    """WebSocket endpoint for streaming TTS"""
    await websocket.accept()
    logger.info("TTS WebSocket connection established")
    
    try:
        while True:
            # Wait for message from client
            data = await websocket.receive_text()
            
            try:
                # Parse the message
                message = json.loads(data)
                
                if message.get("type") == "synthesize":
                    # Start synthesis and stream back
                    text = message.get("text", "")
                    voice_id = message.get("voice_id")
                    voice_settings = message.get("voice_settings")
                    
                    if not text:
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "error": "No text provided"
                        }))
                        continue
                    
                    if not tts_service.is_available():
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "error": "TTS service not available"
                        }))
                        continue
                    
                    # Send stream start message
                    await websocket.send_text(json.dumps({
                        "type": "stream_start",
                        "text": text,
                        "voice_id": voice_id or tts_service.get_default_voice_id()
                    }))
                    
                    chunk_index = 0
                    
                    try:
                        # Stream audio chunks
                        async for chunk in tts_service.synthesize_speech_stream(
                            text=text,
                            voice_id=voice_id,
                            voice_settings=voice_settings
                        ):
                            if chunk:
                                # Encode chunk as base64 for JSON transmission
                                chunk_base64 = base64.b64encode(chunk).decode('utf-8')
                                
                                await websocket.send_text(json.dumps({
                                    "type": "audio_chunk",
                                    "data": chunk_base64,
                                    "chunk_index": chunk_index
                                }))
                                chunk_index += 1
                        
                        # Send stream end message
                        await websocket.send_text(json.dumps({
                            "type": "stream_end",
                            "total_chunks": chunk_index
                        }))
                        
                    except Exception as e:
                        logger.error(f"Error during TTS streaming: {e}")
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "error": f"Synthesis error: {str(e)}"
                        }))
                
                else:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "error": f"Unknown message type: {message.get('type')}"
                    }))
                    
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "error": "Invalid JSON message"
                }))
            except Exception as e:
                logger.error(f"Error processing WebSocket message: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "error": str(e)
                }))
                
    except WebSocketDisconnect:
        logger.info("TTS WebSocket connection closed")
    except Exception as e:
        logger.error(f"TTS WebSocket error: {e}")
        try:
            await websocket.close()
        except:
            pass