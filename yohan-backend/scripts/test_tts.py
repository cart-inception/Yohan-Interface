#!/usr/bin/env python3
"""
Test script for ElevenLabs TTS functionality
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the app directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))

from app.services.tts_service import tts_service
from app.settings import settings

async def test_tts_basic():
    """Test basic TTS functionality"""
    print("🎤 Testing ElevenLabs TTS Service")
    print("=" * 50)
    
    # Test 1: Check if service is available
    print("\n1. Checking TTS service availability...")
    is_available = tts_service.is_available()
    print(f"   Service available: {is_available}")
    
    if not is_available:
        print("   ❌ TTS service not available. Please check:")
        print("      - ELEVENLABS_API_KEY is set in .env file")
        print("      - elevenlabs package is installed")
        return False
    
    # Test 2: Get available voices
    print("\n2. Getting available voices...")
    try:
        voices = await tts_service.get_available_voices()
        print(f"   Found {len(voices)} voices")
        
        # Find Peter voice
        peter_voice = None
        for voice in voices:
            print(f"   - {voice['name']} (ID: {voice['voice_id']})")
            if voice['voice_id'] == tts_service.get_default_voice_id():
                peter_voice = voice
                print(f"     ✅ This is Peter (default voice)")
        
        if not peter_voice:
            print(f"   ⚠️  Peter voice (ID: {tts_service.get_default_voice_id()}) not found in available voices")
    
    except Exception as e:
        print(f"   ❌ Failed to get voices: {e}")
        return False
    
    # Test 3: Synthesize simple text
    print("\n3. Testing text synthesis...")
    test_text = "Hello! This is a test of the ElevenLabs text-to-speech system. I am Peter, your voice assistant."
    
    try:
        print(f"   Synthesizing: '{test_text[:50]}{'...' if len(test_text) > 50 else ''}'")
        audio_data = await tts_service.synthesize_speech(
            text=test_text,
            voice_id=tts_service.get_default_voice_id(),
            use_cache=False  # Don't use cache for test
        )
        
        if audio_data:
            print(f"   ✅ Synthesis successful! Generated {len(audio_data)} bytes of audio")
            
            # Save test audio file
            test_audio_path = Path("test_tts_output.mp3")
            with open(test_audio_path, 'wb') as f:
                f.write(audio_data)
            print(f"   💾 Audio saved to: {test_audio_path.absolute()}")
            
        else:
            print("   ❌ Synthesis failed - no audio data returned")
            return False
            
    except Exception as e:
        print(f"   ❌ Synthesis failed: {e}")
        return False
    
    # Test 4: Test caching
    print("\n4. Testing caching functionality...")
    try:
        print("   First synthesis (no cache)...")
        audio_data_1 = await tts_service.synthesize_speech(
            text="This is a caching test.",
            use_cache=True
        )
        
        print("   Second synthesis (should use cache)...")
        audio_data_2 = await tts_service.synthesize_speech(
            text="This is a caching test.",
            use_cache=True
        )
        
        if audio_data_1 and audio_data_2:
            if len(audio_data_1) == len(audio_data_2):
                print("   ✅ Caching appears to be working (same audio size)")
            else:
                print("   ⚠️  Audio sizes differ - caching may not be working properly")
        else:
            print("   ❌ Caching test failed - one or both syntheses failed")
            
    except Exception as e:
        print(f"   ❌ Caching test failed: {e}")
    
    # Test 5: Get cache stats
    print("\n5. Checking cache statistics...")
    try:
        cache_stats = tts_service.get_cache_stats()
        print(f"   Cache directory: {cache_stats.get('cache_dir', 'Unknown')}")
        print(f"   Total files: {cache_stats.get('total_files', 0)}")
        print(f"   Total size: {cache_stats.get('total_size_mb', 0):.2f} MB")
        print(f"   Max size: {cache_stats.get('max_size_mb', 0):.2f} MB")
        
    except Exception as e:
        print(f"   ❌ Failed to get cache stats: {e}")
    
    print("\n✅ TTS test completed successfully!")
    print("\n📝 Next steps:")
    print("   1. Play the generated test_tts_output.mp3 file to verify audio quality")
    print("   2. Test the voice integration in the frontend")
    print("   3. Verify WebSocket streaming functionality")
    
    return True

async def test_voice_settings():
    """Test different voice settings"""
    print("\n🎛️  Testing Voice Settings")
    print("=" * 30)
    
    if not tts_service.is_available():
        print("❌ TTS service not available")
        return
    
    test_text = "Testing different voice settings."
    settings_variants = [
        {"stability": 0.5, "similarity_boost": 0.5, "style": 0.0},
        {"stability": 0.9, "similarity_boost": 0.8, "style": 0.3},
        {"stability": 0.7, "similarity_boost": 0.6, "style": 0.8},
    ]
    
    for i, voice_settings in enumerate(settings_variants):
        print(f"\nTesting settings variant {i+1}: {voice_settings}")
        try:
            audio_data = await tts_service.synthesize_speech(
                text=test_text,
                voice_settings=voice_settings,
                use_cache=False
            )
            
            if audio_data:
                filename = f"test_voice_settings_{i+1}.mp3"
                with open(filename, 'wb') as f:
                    f.write(audio_data)
                print(f"✅ Generated {filename} ({len(audio_data)} bytes)")
            else:
                print(f"❌ Failed to generate audio for variant {i+1}")
                
        except Exception as e:
            print(f"❌ Error with variant {i+1}: {e}")

async def main():
    """Main test function"""
    print("🚀 Starting TTS Service Tests")
    print(f"Using API key: {'*' * 10}{settings.ELEVENLABS_API_KEY[-4:] if settings.ELEVENLABS_API_KEY else 'NOT SET'}")
    
    # Run basic tests
    success = await test_tts_basic()
    
    if success:
        # Run voice settings tests
        await test_voice_settings()
    
    print("\n🏁 All tests completed!")

if __name__ == "__main__":
    asyncio.run(main())