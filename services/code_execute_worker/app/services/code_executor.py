import os
import logging

from app.services.file_manager import save_code_and_input
from app.services.docker_handler import run_code_in_docker
from app.exceptions import CodeExecutionException
from app.processor_config import PROCESSOR_CONFIG
from app.exceptions import UnsupportedLanguageException

async def execute_code(request):
  """
  Execute user code and return result.
  """
  if request.processor not in PROCESSOR_CONFIG:
    raise UnsupportedLanguageException(request.processor)

  user_dir = save_code_and_input(
    code=request.code,
    input_data=request.input_data,
    processor=request.processor
  )

  try:
    logs_decoded, elapsed_time = run_code_in_docker(
      user_dir=user_dir,
      processor=request.processor
    )
    return {
      "status": "success",
      "output": logs_decoded,
      "execution_time": elapsed_time,
    }
  except CodeExecutionException as e:
    return {"status": "error", "error_message": e.detail}
  finally:
    # Clean up temporary files
    if os.path.exists(user_dir):
      for root, dirs, files in os.walk(user_dir, topdown=False):
        for name in files:
          os.remove(os.path.join(root, name))
        for name in dirs:
          os.rmdir(os.path.join(root, name))
      os.rmdir(user_dir)
    logging.error(f"Finally block executed.")
