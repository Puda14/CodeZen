import os
import requests
from pydantic import BaseModel, ValidationError # type: ignore
from ollama import chat # type: ignore

OLLAMA_ENDPOINT = os.getenv(
  "OLLAMA_ENDPOINT",
  "http://host.docker.internal:11434"
)
DEFAULT_MODEL = "qwen:4b"

def query_ollama_structured(prompt: str, model_class: BaseModel, model: str = DEFAULT_MODEL) -> BaseModel:
  try:
    response = chat(
      messages=[
        {
          'role': 'user',
          'content': prompt,
        }
      ],
      model=model,
      format=model_class.model_json_schema(),
    )

    result = model_class.model_validate_json(response.message.content)
    return result
  except ValidationError as ve:
    raise RuntimeError(f"❌ Failed to parse to {model_class.__name__}: {ve}")
  except Exception as e:
    raise RuntimeError(f"❌ Ollama API call failed: {e}")

def query_ollama(prompt: str, model: str = DEFAULT_MODEL) -> str:
  try:
    response = requests.post(
      f"{OLLAMA_ENDPOINT}/api/generate",
      json={
        "model": model,
        "prompt": prompt,
        "stream": False
      }
    )
    response.raise_for_status()
    return response.json()["response"].strip()
  except Exception as e:
    raise RuntimeError(f"Ollama API call failed: {e}")

def query_ollama_structured(prompt: str, model_class: BaseModel, model: str = DEFAULT_MODEL) -> BaseModel:
  response_text = query_ollama(prompt, model=model)
  try:
    parsed = model_class.parse_raw(response_text)
    return parsed
  except ValidationError as ve:
    raise RuntimeError(f"Failed to parse response to {model_class.__name__}: {ve}\nResponse was:\n{response_text}")

