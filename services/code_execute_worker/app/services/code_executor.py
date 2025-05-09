import os
import logging

from app.services.file_manager import save_code_and_input
from app.services.docker_handler import (
  run_code_in_docker, compile_code_in_docker
)
from app.exceptions import (
  CodeExecutionException,
  UnsupportedLanguageException,
  CompilationErrorException
)
from app.processor_config import PROCESSOR_CONFIG

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

  config = PROCESSOR_CONFIG[request.processor]
  timeout_sec = 3

  try:
    if config.get("needs_compile", False):
      try:
        compile_code_in_docker(user_dir, request.processor)
      except CompilationErrorException as e:
        return {
          "status": "error",
          "error_message": e.detail,
          "exit_code": getattr(e, "exit_code", None)
        }

    logs_decoded, elapsed_time = run_code_in_docker(
      user_dir=user_dir,
      processor=request.processor,
      timeout_sec=timeout_sec
    )

    return {
      "status": "success",
      "output": logs_decoded,
      "execution_time": elapsed_time,
    }

  except CodeExecutionException as e:
    return {"status": "error", "error_message": e.detail}
  except Exception as e:
    logging.error(f"Unexpected error: {e}")
    return {"status": "error", "error_message": str(e)}
  finally:
    try:
      if os.path.exists(user_dir):
        for root, dirs, files in os.walk(user_dir, topdown=False):
          for name in files:
            os.remove(os.path.join(root, name))
          for name in dirs:
            os.rmdir(os.path.join(root, name))
        os.rmdir(user_dir)
      logging.info(f"Cleaned up working directory: {user_dir}")
    except Exception as cleanup_err:
      logging.warning(
        f"Failed to clean up directory {user_dir}: {cleanup_err}"
      )
