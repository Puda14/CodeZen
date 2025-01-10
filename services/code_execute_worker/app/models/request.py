from pydantic import BaseModel # type: ignore

class CodeExecutionRequest(BaseModel):
  processor: str
  code: str
  input_data: str = ""

class Task(BaseModel):
  type: str
  data: CodeExecutionRequest
  correlation_id: str

class TestCase(BaseModel):
  id: str
  input: str
  result: str