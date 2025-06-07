from pydantic import BaseModel  # type: ignore
from app.models.gemini_client import query_gemini_structured


class NormalizedCode(BaseModel):
  code: str


NORMALIZATION_PROMPT = (
"""You are a code canonicalizer. Given any source code string, return the same code:
- Remove all comments (line, inline, block)
- Remove unnecessary blank lines (collapse multiple \n\n to a single \n)
- Replace all variable names with placeholders (e.g., VAR_1, VAR_2)
- Replace all function names with placeholders (e.g., FUNC_1, FUNC_2)
- Replace all class names with placeholders (e.g., CLASS_1, CLASS_2)
- Replace all numeric literals with NUM_1, NUM_2... and string literals with STR_1, STR_2...
- Normalize spacing and indentation
- Normalize equivalent syntax forms (e.g., a = a + 1 → a += 1, if (x == true) → if (x))
- Sort import/include statements alphabetically
- Reorder top-level function definitions in a consistent order (e.g., alphabetically)
Only return the final cleaned code as JSON in the field 'code'
"""
)

def normalize_code_with_gemini(raw_code: str) -> str:
  prompt = (
    f"{NORMALIZATION_PROMPT}\n\n"
    f"### Raw code:\n" + raw_code + "\n"
    f"### Cleaned output as JSON:"
  )
  result = query_gemini_structured(prompt, NormalizedCode)
  return result.code if result else raw_code
