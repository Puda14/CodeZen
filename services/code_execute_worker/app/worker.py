import logging
import asyncio
import os
from app.models.rabbitmq import RabbitMQClient
from app.models.request import Task, CodeExecutionRequest
from app.services.code_executor import execute_code
from app.services.code_evaluate import evaluate_code
from app.processor_config import PROCESSOR_CONFIG
import requests

logging.basicConfig(level=logging.INFO)

class Worker:
  """
  Worker class to process tasks from RabbitMQ queues and send results to the response queue.
  """

  def __init__(self):
    self.rabbitmq = RabbitMQClient()
    self.response_queue = "response_queue"
    self.task_queues = ["code_execution_tasks", "code_evaluation_tasks"]

  def update_leaderboard(self, contest_id, problem_id, user_id, score):
    try:
      url = "http://core-service:8001/leaderboard/update"
      headers = {"x-internal-api-key": os.environ.get("INTERNAL_API_KEY")}
      payload = {
        "contestId": contest_id,
        "problemId": problem_id,
        "userId": user_id,
        "score": score
      }
      response = requests.post(url, json=payload, headers=headers, timeout=5)
      response.raise_for_status()
      logging.info(f"✅ Leaderboard updated for user {user_id} in contest {contest_id}")
    except Exception as e:
      logging.error(f"❌ Failed to update leaderboard: {e}")

  def submit_to_core(self, submission_data):
    try:
      url = "http://core-service:8001/submission"
      headers = {"x-internal-api-key": os.environ.get("INTERNAL_API_KEY")}
      response = requests.post(url, json=submission_data, headers=headers, timeout=5)
      response.raise_for_status()
      logging.info(f"✅ Submission saved for user {submission_data['userId']}")
    except Exception as e:
      logging.error(f"❌ Failed to save submission: {e}")

  async def process_task(self, task):
    """
    Process a single task received from RabbitMQ.
    """
    try:
      # Parse the task using the Task model
      task_obj = Task(**task)
      task_type = task_obj.type
      data = task_obj.data
      correlation_id = task_obj.correlation_id

      if not correlation_id:
        logging.warning("Task is missing correlation_id.")
        return

      response = {"correlation_id": correlation_id}

      # Determine task type and process accordingly
      if task_type == "execute":
        logging.info(f"Processing code execution task: {data}")
        result = await execute_code(data)
        response["result"] = result

      elif task_type == "evaluate":
        logging.info(f"Processing code evaluation task: {data}")
        try:
          result = await evaluate_code(data)
          response["result"] = result

          score = result["summary"]["total_score"]
          # status = "success"

          self.update_leaderboard(
            contest_id=data.contestId,
            problem_id=data.problemId,
            user_id=data.userId,
            score=score
          )

        except Exception as e:
          logging.warning(f"General error: {str(e)}")
          result = {
            "results": [],
            "summary": {
              "passed": 0,
              "failed": len(data.testcases) if data.testcases else 0,
              "total": len(data.testcases) if data.testcases else 0,
              "total_score": 0
            },
          }
          response["result"] = result
          score = 0

        submission_data = {
          "userId": data.userId,
          "contest": data.contestId,
          "problem": data.problemId,
          "code": data.code,
          "language": PROCESSOR_CONFIG[data.processor]["language"],
          "processor": data.processor,
          "score": score,
          "testcaseResults": result.get("results")
        }
        self.submit_to_core(submission_data)

      else:
        logging.warning(f"Unknown task type: {task_type}")
        response["error"] = "Unknown task type"

      self.rabbitmq.publish(self.response_queue, response)
      logging.info(f"Result published to {self.response_queue}: {response}")

    except Exception as e:
      correlation_id = task.get("correlation_id", "unknown")
      error_response = {"correlation_id": correlation_id, "error": str(e)}
      self.rabbitmq.publish(self.response_queue, error_response)
      logging.error(f"Error processing task: {e}")

  def run(self):
    """
    Start the worker and consume tasks from RabbitMQ.
    """
    # Declare all queues
    for queue in self.task_queues:
      self.rabbitmq.declare_queue(queue)
    self.rabbitmq.declare_ttl_queue(self.response_queue, ttl_ms=5000)

    logging.info("Worker started. Waiting for tasks...")

    # Set up consumers for each task queue
    for queue in self.task_queues:
      self.rabbitmq.consume(queue, self._wrapper_process_task)

    # Start consuming messages
    self.rabbitmq.start_consuming()

  def _wrapper_process_task(self, task):
    """
    Wrapper to run async process_task in a synchronous context.
    """
    asyncio.run(self.process_task(task))


if __name__ == "__main__":
  worker = Worker()
  worker.run()
