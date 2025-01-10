import logging
import asyncio
from app.models.rabbitmq import RabbitMQClient
from app.models.request import Task, CodeExecutionRequest
from app.services.code_executor import execute_code
from app.services.code_evaluate import evaluate_code

logging.basicConfig(level=logging.INFO)

class Worker:
  """
  Worker class to process tasks from RabbitMQ queues and send results to the response queue.
  """

  def __init__(self):
    self.rabbitmq = RabbitMQClient()
    self.response_queue = "response_queue"
    self.task_queues = ["code_execution_tasks", "code_evaluation_tasks"]

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
        result = await evaluate_code(data)
        response["result"] = result

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
