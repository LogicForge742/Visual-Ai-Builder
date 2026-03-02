# llm_service.py
# Helper module to call various AI models using litellm.
#
# Supported models mappings (Frontend -> LiteLLM):
#   - gpt-4o           -> openai/gpt-4o
#   - gpt-3.5-turbo    -> openai/gpt-3.5-turbo
#   - claude-3-opus    -> anthropic/claude-3-opus-20240229
#   - claude-3-sonnet  -> anthropic/claude-3-sonnet-20240229
#   - gemini-pro       -> gemini/gemini-pro


import os
from litellm import completion

MODEL_MAPPING = {
    "gpt-4o": "openai/gpt-4o",
    "gpt-3.5-turbo": "openai/gpt-3.5-turbo",
    "claude-3-opus": "anthropic/claude-3-opus-20240229",
    "claude-3-sonnet": "anthropic/claude-3-sonnet-20240229",
    "gemini-pro": "gemini/gemini-2.0-flash",
    "groq-llama3-70b": "groq/llama-3.3-70b-versatile",
    "groq-mixtral": "groq/llama-3.1-8b-instant",
}

def call_llm(model_id: str, api_key: str, system_prompt: str, user_prompt: str) -> str:
    """
    Calls the specified AI model using litellm.
    
    Args:
        model_id (str): The model identifier from the frontend (e.g., 'gpt-4o').
        api_key (str): The user-provided API key for the respective provider.
        system_prompt (str): System-level instructions for the AI.
        user_prompt (str): The actual user query or text.
        
    Returns:
        str: The AI's response text.
    """
    if not api_key or api_key.strip() == "":
        return "Error: API Key is missing. Please provide a valid API key in the LLM node."
        
    # Map the frontend ID to the LiteLLM format, fallback to the provided string if not found
    litellm_model = MODEL_MAPPING.get(model_id, model_id)
    
    # Construct the message array
    messages = []
    
    if system_prompt and system_prompt.strip() != "":
        messages.append({"role": "system", "content": system_prompt})
        
    if user_prompt and user_prompt.strip() != "":
        messages.append({"role": "user", "content": user_prompt})
    else:
        # If there's no user prompt, we just send a generic one or use the system prompt as user prompt if allowed
        messages.append({"role": "user", "content": "Please proceed based on the system instructions."})
        
    try:
        # Call the completion API
        # litellm requires the API key to be passed via os.environ or directly as api_key param
        # The api_key param is standard across providers in litellm
        response = completion(
            model=litellm_model,
            messages=messages,
            api_key=api_key
        )
        
        # Extract the text content from the response
        if response.choices and len(response.choices) > 0:
            return response.choices[0].message.content
        else:
            return "Error: Received empty response from the model."
            
    except Exception as e:
        return f"Error calling model '{model_id}': {str(e)}"


async def async_call_llm(model_id: str, api_key: str, system_prompt: str, user_prompt: str) -> str:
    """
    Async version of call_llm using litellm.acompletion().
    Use this in async FastAPI endpoints so the server doesn't block.
    """
    from litellm import acompletion

    if not api_key or api_key.strip() == "":
        return "Error: API Key is missing. Please provide a valid API key in the LLM node."

    litellm_model = MODEL_MAPPING.get(model_id, model_id)

    messages = []
    if system_prompt and system_prompt.strip() != "":
        messages.append({"role": "system", "content": system_prompt})
    if user_prompt and user_prompt.strip() != "":
        messages.append({"role": "user", "content": user_prompt})
    else:
        messages.append({"role": "user", "content": "Please proceed based on the system instructions."})

    try:
        response = await acompletion(
            model=litellm_model,
            messages=messages,
            api_key=api_key,
        )
        if response.choices and len(response.choices) > 0:
            return response.choices[0].message.content
        else:
            return "Error: Received empty response from the model."
    except Exception as e:
        return f"Error calling model '{model_id}': {str(e)}"
