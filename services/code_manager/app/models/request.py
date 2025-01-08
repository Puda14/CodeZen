from pydantic import BaseModel

class CodeExecutionRequest(BaseModel):
  processor: str
  code: str
  input_data: str = ""

class CodeEvaluationRequest(BaseModel):
  processor: str
  code: str

class TestCase(BaseModel):
  id: str
  input: str
  result: str