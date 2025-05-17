from fastapi import APIRouter, Depends  # type: ignore
from pydantic import BaseModel, Field  # type: ignore
from app.core.agent_pipeline import TestcaseGenerationPipeline
from fastapi.responses import StreamingResponse, JSONResponse  # type: ignore
import requests
import json
import os

from app.auth import jwt_auth_dependency

router = APIRouter()

SUPPORTED_LANGUAGES = [
  "c", "c++11", "c++14", "c++17", "c++20", "c++23",
  "python3", "java", "ruby", "golang", "c#", "javascript",
  "pascal"
]

class TestcaseRequest(BaseModel):
  problem_description: str
  solution_code: str
  processor: str = Field(
    ...,
    description="Processor of the solution code",
    example="c++17"
  )

@router.get("/")
def health_check():
  return {"message": "Gen Testcase Agent Service is running"}

@router.post("/testcases")
def generate_testcases(request: TestcaseRequest):
  pipeline = TestcaseGenerationPipeline()

  def event_stream():
    try:
      yield json.dumps({"status": "starting"}) + "\n"
      for step_result in pipeline.run(
        request.problem_description,
        request.solution_code,
        processor=request.processor
      ):
        yield json.dumps(step_result) + "\n"
      yield json.dumps({"status": "done"}) + "\n"
    except Exception as e:
      yield json.dumps({"error": str(e)}) + "\n"

  return StreamingResponse(
    event_stream(),
    media_type="text/event-stream"
  )

class ExecuteInputsRequest(BaseModel):
  gen_input_code: list[str]
  solution_code: str
  processor: str = "c++23"

@router.post("/testcases/execute")
def execute_inputs(
  request: ExecuteInputsRequest,
  user=Depends(jwt_auth_dependency)
  ):
  results = []

  for input_code in request.gen_input_code:
    try:
      generate_input_payload = {
        "code": input_code,
        "processor": "c++23",
        "input_data": ""
      }

      response_input = requests.post(
        "http://code-manager-service:8002/execute",
        json=generate_input_payload,
        timeout=60,
        headers={
          "x-internal-api-key": os.getenv(
            "INTERNAL_API_KEY",
            "your-very-secret-internal-key"
          )
        }
      )
      response_input.raise_for_status()
      response_input_data = response_input.json()
      result_input = response_input_data.get("result", {})
      if result_input.get("status") != "success":
        raise Exception(f"Generate Input Error: {result_input.get('error_message', 'Unknown Error')}")

      real_input_text = result_input.get("output", "")
      if not real_input_text.strip():
        raise Exception("Generated input is empty.")

      real_input_text = response_input.json().get(
        "result", {}
      ).get("output", "")

      if not real_input_text.strip():
        raise Exception("Generated input is empty.")

      execute_solution_payload = {
        "code": request.solution_code,
        "processor": request.processor,
        "input_data": real_input_text
      }

      response_solution = requests.post(
        "http://code-manager-service:8002/execute",
        json=execute_solution_payload,
        timeout=60,
        headers={
          "x-internal-api-key": os.getenv(
            "INTERNAL_API_KEY",
            "your-very-secret-internal-key"
          )
        }
      )
      response_solution.raise_for_status()

      output_text = response_solution.json().get(
        "result", {}
      ).get("output", "")

      results.append({
        "input": real_input_text,
        "output": output_text
      })

    except Exception as e:
      results.append({
        "input": input_code,
        "output": "<<error>>",
        "error": str(e),
        "generate_input_payload": generate_input_payload,
        "execute_solution_payload": (
          execute_solution_payload
          if 'execute_solution_payload' in locals()
          else None
        ),
        "response_input_text": (
          response_input.text
          if 'response_input' in locals()
          else None
        ),
        "response_solution_text": (
          response_solution.text
          if 'response_solution' in locals()
          else None
        )
      })

  return JSONResponse(content=results)
