import os
from google import genai

# Init Gemini Client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

BACKEND_MODEL0 = "gemini-2.5-flash-preview-04-17"
BACKEND_MODEL1 = "gemini-2.0-flash"
BACKEND_MODEL2 = "gemini-1.5-flash"

DEFAULT_MODEL = BACKEND_MODEL1


def query_gemini_text(
  prompt: str,
  model: str = DEFAULT_MODEL
) -> str:
  response_obj = client.models.generate_content(
    model=model,
    contents=prompt
  )
  return response_obj.text.strip()


def query_gemini_structured(
  prompt: str,
  schema: type,
  model: str = DEFAULT_MODEL
):
  response_obj = client.models.generate_content(
    model=model,
    contents=prompt,
    config={
      "response_mime_type": "application/json",
      "response_schema": schema
    }
  )
  if response_obj.parsed is None:
    print(
      f"\u26a0\ufe0f Gemini returned null for schema. "
      f"Raw response: {response_obj.text}"
    )
  return response_obj.parsed
