import os
import logging

from app.testcases import testcases 

from app.services.file_manager import save_code_and_input
from app.services.docker_handler import run_code_in_docker
from app.exceptions import CodeExecutionException
from app.processor_config import PROCESSOR_CONFIG
from app.exceptions import UnsupportedLanguageException

async def evaluate_code(request):
  """
  Execute user code and return result.
  """
  if request.processor not in PROCESSOR_CONFIG:
    raise UnsupportedLanguageException(request.processor)
  
  results = []
  passed_count = 0
  failed_count = 0

  for test_id, testcase in testcases.items():
    input_data = testcase["input"]
    expected_result = testcase["result"]

    user_dir = save_code_and_input(
      code=request.code,
      input_data=input_data,
      processor=request.processor
    )

    try:
      result = run_code_in_docker(user_dir=user_dir, processor=request.processor).strip()
      if result == expected_result:
        results.append({
          "test_case": test_id,
          "status": "passed",
          "output": result,
        })
        passed_count += 1
      else:
        results.append({
          "test_case": test_id,
          "status": "failed",
          "output": result,
          "expected": expected_result
        })
        failed_count += 1
    except CodeExecutionException as e:
      results.append({
        "test_case": test_id,
        "status": "error",
        "error_message": e.detail
      })
      failed_count += 1
    except Exception as e:
      results.append({
        "test_case": test_id,
        "status": "error",
        "error_message": str(e)
      })
      failed_count += 1
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

  return {
    "results": results,
    "summary": {
      "passed": passed_count,
      "failed": failed_count,
      "total": len(testcases)
    }
  }