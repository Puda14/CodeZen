from pydantic import BaseModel # type: ignore
from typing import Optional, List, Dict

class CodeExecutionRequest(BaseModel):
  processor: str
  code: str
  input_data: str = ""

  contestId: Optional[str] = None
  problemId: Optional[str] = None
  userId: Optional[str] = None
  testcases: Optional[List[Dict]] = None

class Task(BaseModel):
  type: str
  data: CodeExecutionRequest
  correlation_id: str

class TestCase(BaseModel):
  id: str
  input: str
  result: str