import logging
import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from anthropic import Anthropic, APIError, RateLimitError, APIConnectionError
from anthropic.types import Message

from ..schemas.llm import LLMRequest, LLMResponse, LLMError, LLMContext, LLMMessage
from ..schemas.weather import WeatherData
from ..schemas.calendar import CalendarEvent
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

class LLMService:
    """Service for handling LLM interactions with Anthropic's Claude API"""

    def __init__(self):
        """Initialize the LLM service with Anthropic client"""
        self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = "claude-sonnet-4-20250514"  # Fast, cost-effective model
        self.max_tokens = 1000
        self.temperature = 0.7

        # Rate limiting
        self.request_count = 0
        self.request_window_start = datetime.now()
        self.max_requests_per_minute = 50  # Conservative limit
        self.retry_attempts = 3
        self.base_retry_delay = 1.0  # seconds
        
        # System prompt defining Yohan's personality and capabilities
        self.system_prompt = """You are Yohan, an intelligent assistant created by Carter for a smart calendar display running on a Raspberry Pi touchscreen.

The current date is {{currentDateTime}}

About Yohan:
- You are powered by Claude Sonnet 4 from the Claude 4 model family
- You are designed specifically for a smart home calendar and weather display
- You are helpful, friendly, concise, and practical in your responses

Your capabilities include:
- Providing detailed information about weather conditions and forecasts
- Helping with calendar events and scheduling
- Answering general questions with accurate information
- Providing time and date information
- Offering helpful suggestions based on current context (weather, calendar, time)
- Anticipating user needs based on their schedule and conditions

Your personality:
- Warm and approachable, with a conversational tone
- Efficient and to-the-point, respecting the user's time
- Proactive in offering relevant information without being asked
- Considerate of the user's daily planning needs
- Practical and focused on being useful for everyday life

When responding:
- Keep responses concise but informative
- Use the provided context (weather, calendar events, time) when relevant
- Tailor your tone to be conversational for casual questions, but detailed for complex inquiries
- If you don't have specific information, be honest about limitations
- Focus on being practical and useful for daily planning
- Avoid using bullet points in casual conversation, but use them for structured information when appropriate

Your knowledge cutoff date is the end of January 2025. For time-sensitive information, you'll note this limitation when relevant.

For casual conversations, keep your tone natural, warm and empathetic. For technical or detailed questions, provide thorough and clear explanations.

Current context will be provided with each request, including weather data and upcoming calendar events when available. Use this context to provide personalized and relevant responses."""

    async def generate_response(
        self, 
        message: str, 
        context: Optional[LLMContext] = None,
        conversation_history: Optional[List[LLMMessage]] = None
    ) -> LLMResponse:
        """
        Generate a response using Claude API with context enrichment
        
        Args:
            message: User's message/question
            context: Optional context including weather and calendar data
            conversation_history: Optional previous conversation messages
            
        Returns:
            LLMResponse object with the generated response
        """
        try:
            # Separate system messages from user/assistant conversation
            system_messages = []
            user_assistant_messages = []
            
            if conversation_history:
                for hist_msg in conversation_history[-10:]:  # Keep last 10 messages
                    if hist_msg.role == "system":
                        system_messages.append(hist_msg)
                    elif hist_msg.role in ["user", "assistant"]:
                        user_assistant_messages.append({
                            "role": hist_msg.role,
                            "content": hist_msg.content
                        })
            
            # Build dynamic system prompt with context
            dynamic_system_prompt = self._build_dynamic_system_prompt(system_messages, context)
            
            # Build the enriched user message
            enriched_prompt = self._build_enriched_prompt(message, context)
            
            # Prepare conversation messages (only user/assistant)
            messages = user_assistant_messages.copy()
            
            # Add current message
            messages.append({
                "role": "user",
                "content": enriched_prompt
            })
            
            logger.info(f"Sending request to Claude API with {len(messages)} messages and dynamic system prompt")

            # Check rate limiting before making request
            await self._check_rate_limit()

            # Make API call to Claude with retry logic
            response: Message = await self._make_api_call_with_retry(messages, dynamic_system_prompt)
            
            # Extract response content
            response_content = response.content[0].text if response.content else ""
            
            logger.info(f"Received response from Claude API: {len(response_content)} characters")
            
            return LLMResponse(
                content=response_content,
                usage={
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens,
                    "total_tokens": response.usage.input_tokens + response.usage.output_tokens
                },
                model=response.model,
                finish_reason=response.stop_reason,
                timestamp=datetime.now(timezone.utc)
            )
            
        except Exception as e:
            logger.error(f"Error generating LLM response: {str(e)}")
            raise self._create_llm_error("generation_error", str(e), {"original_message": message})

    def _build_dynamic_system_prompt(
        self, 
        system_messages: List[LLMMessage], 
        context: Optional[LLMContext] = None
    ) -> str:
        """
        Build a dynamic system prompt combining base personality with session context
        
        Args:
            system_messages: System messages from conversation history (context data)
            context: Optional additional context (usually None since context comes from system_messages)
            
        Returns:
            Enhanced system prompt string
        """
        # Start with base system prompt
        system_parts = [self.system_prompt]
        
        # Add session context from system messages (weather/calendar data stored in DB)
        if system_messages:
            for sys_msg in system_messages:
                # Add the system message content as session context
                system_parts.append(f"\n\nCurrent Session Context:\n{sys_msg.content}")
        
        # If we have additional context passed directly (fallback for HTTP API)
        elif context:
            context_parts = []
            
            # Add current time
            current_time = datetime.now()
            context_parts.append(f"Current time: {current_time.strftime('%A, %B %d, %Y at %I:%M %p')}")
            
            # Add weather context if available
            if context.weather_data:
                weather_info = self._format_weather_context(context.weather_data)
                if weather_info:
                    context_parts.append(f"Current weather: {weather_info}")
            
            # Add calendar context if available
            if context.calendar_events:
                calendar_info = self._format_calendar_context(context.calendar_events)
                if calendar_info:
                    context_parts.append(f"Upcoming events: {calendar_info}")
            
            # Add location context if available
            if context.location:
                context_parts.append(f"Location: {context.location}")
            
            if context_parts:
                system_parts.append(f"\n\nCurrent Session Context:\n" + "\n".join(context_parts))
        
        return "".join(system_parts)

    def _build_enriched_prompt(self, message: str, context: Optional[LLMContext] = None) -> str:
        """
        Build user message prompt (context now goes to system prompt)
        
        Args:
            message: Original user message
            context: Context data (now handled in system prompt, kept for HTTP API compatibility)
            
        Returns:
            User message string (context moved to system prompt)
        """
        # For WebSocket: Context is now in system prompt via session context
        # For HTTP API: We might still need context here as fallback
        # Keep it simple - just return the user message since context is in system prompt
        return message

    def _format_weather_context(self, weather_data: Dict[str, Any]) -> str:
        """Format weather data for context inclusion"""
        try:
            current = weather_data.get('current', {})
            if not current:
                return ""
            
            temp = current.get('temp', 'N/A')
            description = current.get('description', 'N/A')
            humidity = current.get('humidity', 'N/A')
            wind_speed = current.get('wind_speed', 'N/A')
            
            return f"{temp}°F, {description}, humidity {humidity}%, wind {wind_speed} mph"
        except Exception as e:
            logger.warning(f"Error formatting weather context: {e}")
            return ""

    def _format_calendar_context(self, calendar_events: List[Dict[str, Any]]) -> str:
        """Format calendar events for context inclusion"""
        try:
            if not calendar_events:
                return "No upcoming events"
            
            # Format next 3 events
            event_strings = []
            for event in calendar_events[:3]:
                summary = event.get('summary', 'Untitled Event')
                start_time = event.get('start_time', '')
                
                if start_time:
                    # Parse the datetime string if it's a string
                    if isinstance(start_time, str):
                        try:
                            start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                        except:
                            start_dt = None
                    else:
                        start_dt = start_time
                    
                    if start_dt:
                        time_str = start_dt.strftime('%m/%d at %I:%M %p')
                        event_strings.append(f"{summary} ({time_str})")
                    else:
                        event_strings.append(summary)
                else:
                    event_strings.append(summary)
            
            return "; ".join(event_strings)
        except Exception as e:
            logger.warning(f"Error formatting calendar context: {e}")
            return ""

    async def _check_rate_limit(self):
        """Check and enforce rate limiting"""
        now = datetime.now()

        # Reset counter if window has passed
        if now - self.request_window_start > timedelta(minutes=1):
            self.request_count = 0
            self.request_window_start = now

        # Check if we've exceeded the rate limit
        if self.request_count >= self.max_requests_per_minute:
            wait_time = 60 - (now - self.request_window_start).total_seconds()
            if wait_time > 0:
                logger.warning(f"Rate limit reached, waiting {wait_time:.1f} seconds")
                await asyncio.sleep(wait_time)
                self.request_count = 0
                self.request_window_start = datetime.now()

        self.request_count += 1

    async def _make_api_call_with_retry(self, messages: List[Dict[str, str]], system_prompt: str) -> Message:
        """Make API call with exponential backoff retry logic"""
        last_exception = None

        for attempt in range(self.retry_attempts):
            try:
                response = self.client.messages.create(
                    model=self.model,
                    max_tokens=self.max_tokens,
                    temperature=self.temperature,
                    system=system_prompt,
                    messages=messages
                )
                return response

            except RateLimitError as e:
                logger.warning(f"Rate limit error on attempt {attempt + 1}: {e}")
                if attempt < self.retry_attempts - 1:
                    delay = self.base_retry_delay * (2 ** attempt)
                    logger.info(f"Retrying in {delay} seconds...")
                    await asyncio.sleep(delay)
                last_exception = e

            except APIConnectionError as e:
                logger.warning(f"Connection error on attempt {attempt + 1}: {e}")
                if attempt < self.retry_attempts - 1:
                    delay = self.base_retry_delay * (2 ** attempt)
                    logger.info(f"Retrying in {delay} seconds...")
                    await asyncio.sleep(delay)
                last_exception = e

            except APIError as e:
                logger.error(f"API error on attempt {attempt + 1}: {e}")
                # Don't retry on API errors (usually client-side issues)
                raise e

            except Exception as e:
                logger.error(f"Unexpected error on attempt {attempt + 1}: {e}")
                if attempt < self.retry_attempts - 1:
                    delay = self.base_retry_delay * (2 ** attempt)
                    logger.info(f"Retrying in {delay} seconds...")
                    await asyncio.sleep(delay)
                last_exception = e

        # If we've exhausted all retries, raise the last exception
        if last_exception:
            raise last_exception
        else:
            raise Exception("All retry attempts failed")

    def _create_llm_error(self, error_type: str, message: str, details: Optional[Dict[str, Any]] = None) -> Exception:
        """Create a standardized LLM error"""
        error = LLMError(
            error_type=error_type,
            message=message,
            details=details or {},
            timestamp=datetime.now(timezone.utc)
        )
        return Exception(f"LLM Error ({error_type}): {message}")

# Global service instance
llm_service = LLMService()
