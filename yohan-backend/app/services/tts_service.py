import logging
import asyncio
import hashlib
import os
from pathlib import Path
from typing import Optional, Dict, Any, List, BinaryIO
from datetime import datetime, timedelta
from elevenlabs import ElevenLabs, Voice, VoiceSettings
from elevenlabs.client import ElevenLabs as ElevenLabsClient
import httpx

from ..settings import settings

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Create console handler if not already configured
if not logger.handlers:
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

class TTSService:
    """Service for handling Text-to-Speech using ElevenLabs API with caching and fallback"""

    def __init__(self):
        """Initialize the TTS service with ElevenLabs client"""
        self.client = None
        self.default_voice_id = "ZthjuvLPty3kTMaNKVKb"  # Peter voice ID
        self.fallback_enabled = True
        
        # Voice settings for Peter
        self.voice_settings = VoiceSettings(
            stability=0.85,      # Higher stability for clearer speech
            similarity_boost=0.75, # Good balance for natural speech
            style=0.5,           # Moderate style influence
            use_speaker_boost=True
        )
        
        # Cache configuration
        self.cache_dir = Path("./cache/tts")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.cache_max_age_hours = 24 * 7  # 1 week
        self.max_cache_size_mb = 100  # 100MB cache limit
        
        # Rate limiting
        self.request_count = 0
        self.request_window_start = datetime.now()
        self.max_requests_per_minute = 20  # Conservative ElevenLabs limit
        
        # Available voices cache
        self._voices_cache: Optional[List[Voice]] = None
        self._voices_cache_time: Optional[datetime] = None
        self._voices_cache_ttl = timedelta(hours=1)
        
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize ElevenLabs client if API key is available"""
        try:
            if settings.ELEVENLABS_API_KEY:
                self.client = ElevenLabsClient(api_key=settings.ELEVENLABS_API_KEY)
                logger.info("ElevenLabs TTS service initialized successfully")
            else:
                logger.warning("ELEVENLABS_API_KEY not found, TTS service will use fallback only")
                self.client = None
        except Exception as e:
            logger.error(f"Failed to initialize ElevenLabs client: {e}")
            self.client = None
    
    def is_available(self) -> bool:
        """Check if ElevenLabs TTS service is available"""
        return self.client is not None
    
    def _generate_cache_key(self, text: str, voice_id: str, voice_settings: VoiceSettings) -> str:
        """Generate a cache key for the given text and voice settings"""
        # Create a hash of text + voice settings for cache key
        content = f"{text}_{voice_id}_{voice_settings.stability}_{voice_settings.similarity_boost}_{voice_settings.style}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def _get_cache_path(self, cache_key: str) -> Path:
        """Get the cache file path for a given cache key"""
        return self.cache_dir / f"{cache_key}.mp3"
    
    def _is_cache_valid(self, cache_path: Path) -> bool:
        """Check if a cached file is still valid"""
        if not cache_path.exists():
            return False
        
        # Check if file is too old
        file_age = datetime.now() - datetime.fromtimestamp(cache_path.stat().st_mtime)
        if file_age > timedelta(hours=self.cache_max_age_hours):
            try:
                cache_path.unlink()  # Remove old cache file
                logger.debug(f"Removed expired cache file: {cache_path}")
            except Exception as e:
                logger.warning(f"Failed to remove expired cache file {cache_path}: {e}")
            return False
        
        return True
    
    def _cleanup_cache(self):
        """Clean up old cache files to stay within size limit"""
        try:
            # Get all cache files sorted by modification time (oldest first)
            cache_files = [(f, f.stat().st_mtime) for f in self.cache_dir.glob("*.mp3")]
            cache_files.sort(key=lambda x: x[1])
            
            # Calculate total cache size
            total_size_mb = sum(f[0].stat().st_size for f in cache_files) / (1024 * 1024)
            
            # Remove oldest files if we exceed the limit
            while total_size_mb > self.max_cache_size_mb and cache_files:
                oldest_file, _ = cache_files.pop(0)
                try:
                    file_size_mb = oldest_file.stat().st_size / (1024 * 1024)
                    oldest_file.unlink()
                    total_size_mb -= file_size_mb
                    logger.debug(f"Removed cache file to free space: {oldest_file}")
                except Exception as e:
                    logger.warning(f"Failed to remove cache file {oldest_file}: {e}")
                    
        except Exception as e:
            logger.warning(f"Cache cleanup failed: {e}")
    
    async def _check_rate_limit(self):
        """Check and enforce rate limiting"""
        now = datetime.now()
        
        # Reset counter if window has passed
        if now - self.request_window_start > timedelta(minutes=1):
            self.request_count = 0
            self.request_window_start = now
        
        # Check if we're hitting the rate limit
        if self.request_count >= self.max_requests_per_minute:
            wait_time = 60 - (now - self.request_window_start).total_seconds()
            if wait_time > 0:
                logger.warning(f"Rate limit reached, waiting {wait_time:.1f} seconds")
                await asyncio.sleep(wait_time)
                self.request_count = 0
                self.request_window_start = datetime.now()
        
        self.request_count += 1
    
    async def get_available_voices(self, force_refresh: bool = False) -> List[Dict[str, Any]]:
        """Get list of available voices from ElevenLabs"""
        if not self.client:
            return []
        
        # Check cache
        now = datetime.now()
        if (not force_refresh and 
            self._voices_cache is not None and 
            self._voices_cache_time is not None and 
            now - self._voices_cache_time < self._voices_cache_ttl):
            return [{"voice_id": v.voice_id, "name": v.name, "category": getattr(v, 'category', 'Unknown')} for v in self._voices_cache]
        
        try:
            await self._check_rate_limit()
            
            # Fetch voices from API using the client
            voice_response = self.client.voices.get_all()
            self._voices_cache = voice_response.voices
            self._voices_cache_time = now
            
            logger.info(f"Retrieved {len(self._voices_cache)} voices from ElevenLabs")
            
            return [{"voice_id": v.voice_id, "name": v.name, "category": getattr(v, 'category', 'Unknown')} for v in self._voices_cache]
            
        except Exception as e:
            logger.error(f"Failed to get available voices: {e}")
            # Return default Peter voice info if we can't get the list
            return [{"voice_id": self.default_voice_id, "name": "Peter", "category": "Default"}]
    
    async def synthesize_speech(
        self,
        text: str,
        voice_id: Optional[str] = None,
        voice_settings: Optional[Dict[str, Any]] = None,
        use_cache: bool = True
    ) -> Optional[bytes]:
        """
        Synthesize speech from text using ElevenLabs API
        
        Args:
            text: Text to synthesize
            voice_id: Voice ID to use (defaults to Peter)
            voice_settings: Voice settings override
            use_cache: Whether to use caching
            
        Returns:
            Audio data as bytes or None if failed
        """
        if not self.client:
            logger.warning("ElevenLabs client not available, cannot synthesize speech")
            return None
        
        if not text or not text.strip():
            logger.warning("Empty text provided for synthesis")
            return None
        
        # Use default voice if not specified
        if not voice_id:
            voice_id = self.default_voice_id
        
        # Use default voice settings if not specified
        settings_obj = self.voice_settings
        if voice_settings:
            settings_obj = VoiceSettings(
                stability=voice_settings.get('stability', self.voice_settings.stability),
                similarity_boost=voice_settings.get('similarity_boost', self.voice_settings.similarity_boost),
                style=voice_settings.get('style', self.voice_settings.style),
                use_speaker_boost=voice_settings.get('use_speaker_boost', self.voice_settings.use_speaker_boost)
            )
        
        # Check cache first
        cache_key = self._generate_cache_key(text, voice_id, settings_obj)
        cache_path = self._get_cache_path(cache_key)
        
        if use_cache and self._is_cache_valid(cache_path):
            try:
                with open(cache_path, 'rb') as f:
                    audio_data = f.read()
                logger.debug(f"Serving audio from cache: {cache_key}")
                return audio_data
            except Exception as e:
                logger.warning(f"Failed to read cache file {cache_path}: {e}")
        
        try:
            await self._check_rate_limit()
            
            logger.info(f"Synthesizing speech for text: '{text[:50]}{'...' if len(text) > 50 else ''}' with voice {voice_id}")
            
            # Generate speech using ElevenLabs client
            audio_data = self.client.text_to_speech.convert(
                voice_id=voice_id,
                text=text,
                voice_settings=settings_obj,
                model_id="eleven_multilingual_v2"  # High quality model
            )
            
            # Convert to bytes if needed
            if hasattr(audio_data, '__iter__') and not isinstance(audio_data, bytes):
                audio_data = b''.join(audio_data)
            elif not isinstance(audio_data, bytes):
                audio_data = bytes(audio_data)
            
            # Cache the result if caching is enabled
            if use_cache and audio_data:
                try:
                    with open(cache_path, 'wb') as f:
                        f.write(audio_data)
                    logger.debug(f"Cached audio data: {cache_key}")
                    
                    # Clean up cache if needed
                    self._cleanup_cache()
                    
                except Exception as e:
                    logger.warning(f"Failed to cache audio data: {e}")
            
            logger.info(f"Successfully synthesized {len(audio_data)} bytes of audio")
            return audio_data
            
        except Exception as e:
            logger.error(f"Failed to synthesize speech: {e}")
            return None
    
    async def synthesize_speech_stream(
        self,
        text: str,
        voice_id: Optional[str] = None,
        voice_settings: Optional[Dict[str, Any]] = None
    ):
        """
        Synthesize speech and yield audio chunks for streaming
        
        Args:
            text: Text to synthesize
            voice_id: Voice ID to use (defaults to Peter)
            voice_settings: Voice settings override
            
        Yields:
            Audio chunks as bytes
        """
        if not self.client:
            logger.warning("ElevenLabs client not available, cannot stream speech")
            return
        
        if not text or not text.strip():
            logger.warning("Empty text provided for streaming synthesis")
            return
        
        # Use default voice if not specified
        if not voice_id:
            voice_id = self.default_voice_id
        
        # Use default voice settings if not specified
        settings_obj = self.voice_settings
        if voice_settings:
            settings_obj = VoiceSettings(
                stability=voice_settings.get('stability', self.voice_settings.stability),
                similarity_boost=voice_settings.get('similarity_boost', self.voice_settings.similarity_boost),
                style=voice_settings.get('style', self.voice_settings.style),
                use_speaker_boost=voice_settings.get('use_speaker_boost', self.voice_settings.use_speaker_boost)
            )
        
        try:
            await self._check_rate_limit()
            
            logger.info(f"Streaming speech synthesis for text: '{text[:50]}{'...' if len(text) > 50 else ''}' with voice {voice_id}")
            
            # Generate speech using ElevenLabs streaming
            audio_stream = self.client.text_to_speech.convert_as_stream(
                voice_id=voice_id,
                text=text,
                voice_settings=settings_obj,
                model_id="eleven_multilingual_v2"
            )
            
            # Yield audio chunks
            for chunk in audio_stream:
                if chunk:
                    yield chunk
                    
        except Exception as e:
            logger.error(f"Failed to stream speech synthesis: {e}")
    
    def get_voice_info(self, voice_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a specific voice"""
        if not self.client:
            return None
        
        try:
            if self._voices_cache:
                for voice in self._voices_cache:
                    if voice.voice_id == voice_id:
                        return {
                            "voice_id": voice.voice_id,
                            "name": voice.name,
                            "category": voice.category
                        }
            return None
            
        except Exception as e:
            logger.error(f"Failed to get voice info for {voice_id}: {e}")
            return None
    
    def get_default_voice_id(self) -> str:
        """Get the default voice ID (Peter)"""
        return self.default_voice_id
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        try:
            cache_files = list(self.cache_dir.glob("*.mp3"))
            total_size = sum(f.stat().st_size for f in cache_files)
            total_size_mb = total_size / (1024 * 1024)
            
            return {
                "cache_dir": str(self.cache_dir),
                "total_files": len(cache_files),
                "total_size_mb": round(total_size_mb, 2),
                "max_size_mb": self.max_cache_size_mb,
                "max_age_hours": self.cache_max_age_hours
            }
        except Exception as e:
            logger.error(f"Failed to get cache stats: {e}")
            return {"error": str(e)}

# Global TTS service instance
tts_service = TTSService()