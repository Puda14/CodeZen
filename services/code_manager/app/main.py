from fastapi import FastAPI, HTTPException, status # type: ignore
from app.models.request import CodeExecutionRequest, CodeEvaluationRequest
from app.services.code_executor import execute_code
from app.services.code_evaluate import evaluate_code

app = FastAPI()

@app.get("/")
def read_root():
  return {"message": "Code Manager Service is running"}

@app.post("/execute", status_code=200)
async def execute_code_endpoint(request: CodeExecutionRequest):
  """
  API endpoint to execute user-submitted code and return the result.
  """
  # return {"message": "Code Manager Service is running"}
  try:
    result = await execute_code(request)
    return result
  except Exception as e:
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail=str(e)
    )

@app.post("/testcase", status_code=200)
async def evaluate_testcases_endpoint(request: CodeExecutionRequest):
  """
  API endpoint to evaluate user-submitted code against testcases.
  """
  try:
    results = await evaluate_code(request)
    return results
  except Exception as e:
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail=str(e)
    )

