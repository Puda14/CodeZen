import os
import uuid
import time
import logging
from app.services.redis_utils import get_contest_data, is_user_approved, get_problem_testcases, get_problem_max_submissions
import json
from fastapi import FastAPI, HTTPException, Depends  # type: ignore
from app.auth import jwt_auth_dependency
from app.models.rabbitmq import RabbitMQClient
from app.models.request import CodeExecutionRequest, Task
import requests

app = FastAPI()
rabbitmq = RabbitMQClient()

@app.on_event("startup")
async def startup_event():
  """
  Startup event to declare queues and initialize RabbitMQ connection.
  """
  rabbitmq.declare_queue("code_execution_tasks")
  rabbitmq.declare_queue("code_evaluation_tasks")
  rabbitmq.declare_ttl_queue("response_queue", ttl_ms=5000)

@app.on_event("shutdown")
async def shutdown_event():
  """
  Shutdown event to close RabbitMQ connection.
  """
  rabbitmq.close()

def handle_task(queue_name: str, task_type: str, request: CodeExecutionRequest, timeout: int):
  """
  Handle task logic for publishing to a queue and waiting for a response.

  Args:
    queue_name (str): The RabbitMQ queue to publish the task.
    task_type (str): Type of the task, e.g., "execute" or "evaluate".
    request (CodeExecutionRequest): The incoming request data.
    timeout (int): Timeout for waiting for a response.

  Returns:
    dict: Response message from the worker.
  """
  try:
    correlation_id = str(uuid.uuid4())
    task = Task(type=task_type, data=request, correlation_id=correlation_id)
    rabbitmq.publish(queue_name, task.dict())

    start_time = time.time()
    while time.time() - start_time < timeout:
      message = rabbitmq.get_message("response_queue")
      if message and message.get("correlation_id") == correlation_id:
        logging.info(f"Response found for correlation_id: {correlation_id}")
        return message
      time.sleep(0.5)

    raise HTTPException(status_code=504, detail="Timeout waiting for task result.")
  except Exception as e:
    logging.error(f"Error processing task '{task_type}': {e}")
    raise HTTPException(status_code=500, detail=str(e))

@app.post("/execute", status_code=200)
async def execute_code_endpoint(
    request: CodeExecutionRequest,
    user=Depends(jwt_auth_dependency),
):
  """
  API endpoint to enqueue a code execution task and return the result.
  """
  return handle_task(queue_name="code_execution_tasks", task_type="execute", request=request, timeout=10)

@app.post("/evaluate", status_code=200)
async def evaluate_testcases_endpoint(
  request: CodeExecutionRequest,
  user=Depends(jwt_auth_dependency),
):
  request.userId = user["_id"]

  if not request.contestId or not request.problemId:
    raise HTTPException(status_code=400, detail="Missing contestId or problemId.")

  contest = get_contest_data(request.contestId)

  if not is_user_approved(contest, request.userId):
    raise HTTPException(status_code=403, detail="User is not approved to submit in this contest.")

  max_submissions = get_problem_max_submissions(contest, request.problemId)

  try:
    core_url = os.getenv("CORE_SERVICE_URL", "http://core-service:8001")
    resp = requests.get(
      f"{core_url}/submission/count",
      params={
        "userId": request.userId,
        "contestId": request.contestId,
        "problemId": request.problemId,
      },
      headers={"x-internal-api-key": os.getenv("INTERNAL_API_KEY")}
    )
    resp.raise_for_status()
    attempt_number = resp.json()["count"]
  except Exception as e:
    raise HTTPException(status_code=500, detail=f"Failed to check submission count: {e}")

  print(f"submissions: {attempt_number}/{max_submissions}")

  if attempt_number >= max_submissions:
    raise HTTPException(status_code=403, detail=f"Maximum submission limit ({max_submissions}) reached.")

  testcases = get_problem_testcases(contest, request.problemId)
  request.testcases = testcases

  return handle_task(
    queue_name="code_evaluation_tasks",
    task_type="evaluate",
    request=request,
    timeout=30
  )
