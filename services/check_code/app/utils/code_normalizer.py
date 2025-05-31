from pydantic import BaseModel  # type: ignore
from app.models.gemini_client import query_gemini_structured


class NormalizedCode(BaseModel):
  code: str


NORMALIZATION_PROMPT = (
  "You are a code cleaner. Given any source code string, return the same code "
  "but with ALL comments removed (line comments, block comments, inline comments) and unnecessary blank lines removed. "
  "Keep line breaks for readability, but collapse consecutive \n\n into one \n. Only return cleaned code as JSON field `code`."
)

def normalize_code_with_gemini(raw_code: str) -> str:
  prompt = (
    f"{NORMALIZATION_PROMPT}\n\n"
    f"### Raw code:\n" + raw_code + "\n"
    f"### Cleaned output as JSON:"
  )
  result = query_gemini_structured(prompt, NormalizedCode)
  return result.code if result else raw_code
