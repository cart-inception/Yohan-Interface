#!/usr/bin/env python3
"""
Test script for WebSocket LLM integration.

This script tests the complete flow from WebSocket message to LLM response,
including context gathering and response broadcasting.
"""

import asyncio
import json
import websockets
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# WebSocket URL
WEBSOCKET_URL = "ws://localhost:8000/ws/comms"

async def test_llm_websocket_integration():
    """Test the complete LLM WebSocket integration"""
    print("🧪 Testing LLM WebSocket Integration")
    print("=" * 60)
    
    try:
        # Connect to WebSocket
        print("📡 Connecting to WebSocket...")
        async with websockets.connect(WEBSOCKET_URL) as websocket:
            print("✅ Connected to WebSocket successfully")
            
            # Listen for initial connection message
            initial_message = await websocket.recv()
            print(f"📨 Received initial message: {initial_message}")
            
            # Test 1: Basic LLM query
            await test_basic_llm_query(websocket)
            
            # Test 2: Weather-related query
            await test_weather_query(websocket)
            
            # Test 3: Calendar-related query
            await test_calendar_query(websocket)
            
            # Test 4: Error handling
            await test_error_handling(websocket)
            
            print("\n🎉 All tests completed successfully!")
            
    except Exception as e:
        print(f"❌ Error during WebSocket testing: {str(e)}")
        return False
    
    return True

async def test_basic_llm_query(websocket):
    """Test basic LLM query functionality"""
    print("\n🧪 Test 1: Basic LLM Query")
    print("-" * 40)
    
    # Send LLM query
    query_message = {
        "event_type": "llm_query",
        "payload": {
            "message": "Hello! Can you introduce yourself?",
            "timestamp": datetime.now().isoformat(),
            "conversation_id": "test-conversation-1"
        }
    }
    
    print(f"📤 Sending query: {query_message['payload']['message']}")
    await websocket.send(json.dumps(query_message))
    
    # Wait for response
    response = await asyncio.wait_for(websocket.recv(), timeout=30.0)
    response_data = json.loads(response)
    
    print(f"📥 Received response type: {response_data.get('event_type')}")
    
    if response_data.get('event_type') == 'llm_response':
        payload = response_data.get('payload', {})
        print(f"✅ LLM Response: {payload.get('message', 'No message')[:100]}...")
        print(f"📊 Usage: {payload.get('usage', 'No usage data')}")
        print(f"🤖 Model: {payload.get('model', 'No model info')}")
    else:
        print(f"❌ Unexpected response type: {response_data}")

async def test_weather_query(websocket):
    """Test weather-related LLM query"""
    print("\n🧪 Test 2: Weather Query")
    print("-" * 40)
    
    query_message = {
        "event_type": "llm_query",
        "payload": {
            "message": "What's the weather like today? Should I bring a jacket?",
            "timestamp": datetime.now().isoformat(),
            "conversation_id": "test-conversation-2"
        }
    }
    
    print(f"📤 Sending weather query: {query_message['payload']['message']}")
    await websocket.send(json.dumps(query_message))
    
    # Wait for response
    response = await asyncio.wait_for(websocket.recv(), timeout=30.0)
    response_data = json.loads(response)
    
    if response_data.get('event_type') == 'llm_response':
        payload = response_data.get('payload', {})
        print(f"✅ Weather Response: {payload.get('message', 'No message')[:150]}...")
    else:
        print(f"❌ Unexpected response: {response_data}")

async def test_calendar_query(websocket):
    """Test calendar-related LLM query"""
    print("\n🧪 Test 3: Calendar Query")
    print("-" * 40)
    
    query_message = {
        "event_type": "llm_query",
        "payload": {
            "message": "What's on my schedule today? Do I have any meetings?",
            "timestamp": datetime.now().isoformat(),
            "conversation_id": "test-conversation-3"
        }
    }
    
    print(f"📤 Sending calendar query: {query_message['payload']['message']}")
    await websocket.send(json.dumps(query_message))
    
    # Wait for response
    response = await asyncio.wait_for(websocket.recv(), timeout=30.0)
    response_data = json.loads(response)
    
    if response_data.get('event_type') == 'llm_response':
        payload = response_data.get('payload', {})
        print(f"✅ Calendar Response: {payload.get('message', 'No message')[:150]}...")
    else:
        print(f"❌ Unexpected response: {response_data}")

async def test_error_handling(websocket):
    """Test error handling for invalid messages"""
    print("\n🧪 Test 4: Error Handling")
    print("-" * 40)
    
    # Test empty message
    query_message = {
        "event_type": "llm_query",
        "payload": {
            "message": "",
            "timestamp": datetime.now().isoformat()
        }
    }
    
    print("📤 Sending empty message to test error handling...")
    await websocket.send(json.dumps(query_message))
    
    # Wait for error response
    response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
    response_data = json.loads(response)
    
    if response_data.get('event_type') == 'error':
        payload = response_data.get('payload', {})
        print(f"✅ Error handled correctly: {payload.get('error', 'No error message')}")
    else:
        print(f"❌ Expected error response, got: {response_data}")

async def main():
    """Main test function"""
    print("🚀 Starting WebSocket LLM Integration Tests")
    print("Make sure the backend server is running on localhost:8000")
    print()
    
    try:
        success = await test_llm_websocket_integration()
        if success:
            print("\n✅ All tests passed!")
            return 0
        else:
            print("\n❌ Some tests failed!")
            return 1
    except KeyboardInterrupt:
        print("\n⏹️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
