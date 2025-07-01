#!/usr/bin/env python3
"""
Test script to verify LLM service functionality.
This script tests the LLM service with various scenarios.
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.llm_service import llm_service
from app.schemas.llm import LLMContext

async def test_basic_response():
    """Test basic LLM response without context"""
    print("🧪 Testing basic LLM response...")
    print("-" * 50)
    
    try:
        response = await llm_service.generate_response(
            message="Hello! Can you introduce yourself?"
        )
        
        print("✅ SUCCESS: Basic response generated")
        print(f"Response: {response.content}")
        print(f"Model: {response.model}")
        print(f"Usage: {response.usage}")
        print("-" * 50)
        return True
        
    except Exception as e:
        print("❌ ERROR: Failed to generate basic response")
        print(f"Error: {str(e)}")
        print("-" * 50)
        return False

async def test_context_enriched_response():
    """Test LLM response with weather and calendar context"""
    print("🧪 Testing context-enriched response...")
    print("-" * 50)
    
    try:
        # Mock context data
        context = LLMContext(
            weather_data={
                "current": {
                    "temp": 72.5,
                    "description": "partly cloudy",
                    "humidity": 65,
                    "wind_speed": 8.2
                }
            },
            calendar_events=[
                {
                    "summary": "Team Meeting",
                    "start_time": "2025-07-01T14:00:00Z"
                },
                {
                    "summary": "Doctor Appointment",
                    "start_time": "2025-07-01T16:30:00Z"
                }
            ],
            location="Des Moines, Iowa"
        )
        
        response = await llm_service.generate_response(
            message="What's my day looking like?",
            context=context
        )
        
        print("✅ SUCCESS: Context-enriched response generated")
        print(f"Response: {response.content}")
        print(f"Usage: {response.usage}")
        print("-" * 50)
        return True
        
    except Exception as e:
        print("❌ ERROR: Failed to generate context-enriched response")
        print(f"Error: {str(e)}")
        print("-" * 50)
        return False

async def test_weather_question():
    """Test weather-specific question"""
    print("🧪 Testing weather-specific question...")
    print("-" * 50)
    
    try:
        context = LLMContext(
            weather_data={
                "current": {
                    "temp": 68.3,
                    "description": "light rain",
                    "humidity": 85,
                    "wind_speed": 12.1
                }
            },
            location="Des Moines, Iowa"
        )
        
        response = await llm_service.generate_response(
            message="Should I bring an umbrella today?",
            context=context
        )
        
        print("✅ SUCCESS: Weather question answered")
        print(f"Response: {response.content}")
        print("-" * 50)
        return True
        
    except Exception as e:
        print("❌ ERROR: Failed to answer weather question")
        print(f"Error: {str(e)}")
        print("-" * 50)
        return False

async def test_conversation_history():
    """Test conversation with history"""
    print("🧪 Testing conversation with history...")
    print("-" * 50)
    
    try:
        from app.schemas.llm import LLMMessage
        
        # Mock conversation history
        history = [
            LLMMessage(role="user", content="What's the weather like?"),
            LLMMessage(role="assistant", content="It's currently 72°F and partly cloudy in Des Moines."),
            LLMMessage(role="user", content="Is it good weather for a walk?")
        ]
        
        response = await llm_service.generate_response(
            message="What about for outdoor exercise?",
            conversation_history=history
        )
        
        print("✅ SUCCESS: Conversation with history processed")
        print(f"Response: {response.content}")
        print("-" * 50)
        return True
        
    except Exception as e:
        print("❌ ERROR: Failed to process conversation with history")
        print(f"Error: {str(e)}")
        print("-" * 50)
        return False

async def main():
    """Main test function"""
    print("🤖 Yohan Smart Calendar - LLM Service Test")
    print("=" * 60)
    
    tests = [
        ("Basic Response", test_basic_response),
        ("Context-Enriched Response", test_context_enriched_response),
        ("Weather Question", test_weather_question),
        ("Conversation History", test_conversation_history)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n📋 Running: {test_name}")
        success = await test_func()
        if success:
            passed += 1
        print()
    
    print("=" * 60)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! LLM service is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
    
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
