#!/usr/bin/env python3
"""
Test script to verify Anthropic API key and basic functionality.
This script tests the connection to Anthropic's Claude API.
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from anthropic import Anthropic
from app.settings import settings

async def test_anthropic_connection():
    """Test basic connection to Anthropic API"""
    print("Testing Anthropic API connection...")
    print(f"Timestamp: {datetime.now()}")
    print("-" * 50)
    
    try:
        # Initialize the Anthropic client
        client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        
        # Test message
        test_message = "Hello! Please respond with a brief greeting to confirm the connection is working."
        
        print(f"Sending test message: {test_message}")
        print("-" * 50)
        
        # Make a simple API call
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=100,
            messages=[
                {"role": "user", "content": test_message}
            ]
        )
        
        print("✅ SUCCESS: Anthropic API connection working!")
        print(f"Model: {response.model}")
        print(f"Response: {response.content[0].text}")
        print(f"Usage: {response.usage}")
        print("-" * 50)
        
        return True
        
    except Exception as e:
        print("❌ ERROR: Failed to connect to Anthropic API")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print("-" * 50)
        return False

def test_api_key_format():
    """Test if the API key has the correct format"""
    print("Testing API key format...")
    
    api_key = settings.ANTHROPIC_API_KEY
    
    if not api_key:
        print("❌ ERROR: ANTHROPIC_API_KEY is not set")
        return False
    
    if not api_key.startswith("sk-ant-"):
        print("❌ ERROR: API key doesn't start with 'sk-ant-'")
        print(f"Current key starts with: {api_key[:10]}...")
        return False
    
    if len(api_key) < 50:
        print("❌ ERROR: API key seems too short")
        return False
    
    print("✅ SUCCESS: API key format looks correct")
    print(f"Key starts with: {api_key[:10]}...")
    print(f"Key length: {len(api_key)} characters")
    return True

async def main():
    """Main test function"""
    print("🤖 Yohan Smart Calendar - Anthropic API Test")
    print("=" * 60)
    
    # Test 1: API key format
    key_test = test_api_key_format()
    print()
    
    # Test 2: API connection (only if key format is correct)
    if key_test:
        connection_test = await test_anthropic_connection()
        print()
        
        if connection_test:
            print("🎉 All tests passed! Anthropic integration is ready.")
        else:
            print("⚠️  API key format is correct but connection failed.")
            print("   Please check your internet connection and API key validity.")
    else:
        print("⚠️  Skipping connection test due to API key format issues.")
        print("   Please check your .env file and ensure ANTHROPIC_API_KEY is set correctly.")
    
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
