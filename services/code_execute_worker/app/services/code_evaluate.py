import os
import uuid
import logging

from app.services.file_manager import (
  save_code, save_input, create_user_workdir
)
from app.services.docker_handler import (
  run_code_in_docker, compile_code_in_docker
)
from app.processor_config import PROCESSOR_CONFIG
from app.exceptions import (
  UnsupportedLanguageException,
  CompilationErrorException,
  RuntimeErrorException,
  TimeLimitExceededException,
  MemoryLimitExceededException,
  SegmentationFaultException
)

async def evaluate_code(request):
  if request.processor not in PROCESSOR_CONFIG:
    raise UnsupportedLanguageException(request.processor)

  testcases = getattr(request, "testcases", None)
  if not testcases or not isinstance(testcases, list):
    raise ValueError("No testcases provided in request.")

  user_dir = create_user_workdir()
  save_code(request.code, request.processor, user_dir)

  config = PROCESSOR_CONFIG[request.processor]
  if config.get("needs_compile", False):
    try:
      compile_code_in_docker(user_dir, request.processor)
    except CompilationErrorException as e:
      results = [{
        "test_case": f"test{idx+1:02d}",
        "status": "compile_error",
        "output": "",
        "error_message": e.detail,
        "exit_code": getattr(e, "exit_code", None),
        "score": 0
      } for idx in range(len(testcases))]
      return {
        "results": results,
        "summary": {
          "passed": 0,
          "failed": len(testcases),
          "total": len(testcases),
          "total_score": 0
        }
      }

  results = []
  passed_count = 0
  failed_count = 0
  total_score = 0

  for idx, testcase in enumerate(testcases, start=1):
    test_id = f"test{idx:02d}"
    input_data = testcase.get("input", "")
    expected_result = testcase.get("output", "").rstrip(' \n\r')
    score = testcase.get("score", 0)
    is_public = testcase.get("isPublic", False)

    save_input(input_data, user_dir)

    try:
      result_raw, execution_time = run_code_in_docker(
        user_dir=user_dir, processor=request.processor
      )
      result = result_raw.rstrip(' \n\r')

      if result == expected_result:
        results.append({
          "test_case": test_id,
          "status": "passed",
          "output": result,
          "score": score,
          "execution_time": execution_time,
          "exit_code": 0,
        })
        passed_count += 1
        total_score += score
      else:
        res = {
          "test_case": test_id,
          "status": "failed",
          "output": result,
          "score": 0,
          "execution_time": execution_time,
          "exit_code": 0,
        }
        if is_public:
          res["expected"] = expected_result
        results.append(res)
        failed_count += 1

    except RuntimeErrorException as e:
      results.append({
        "test_case": test_id,
        "status": "runtime_error",
        "output": "",
        "error_message": e.detail,
        "exit_code": getattr(e, "exit_code", None),
        "score": 0
      })
      failed_count += 1
    except TimeLimitExceededException as e:
      results.append({
        "test_case": test_id,
        "status": "tle",
        "output": "",
        "error_message": e.detail,
        "exit_code": getattr(e, "exit_code", None),
        "score": 0
      })
      failed_count += 1
    except MemoryLimitExceededException as e:
      results.append({
        "test_case": test_id,
        "status": "mle",
        "output": "",
        "error_message": e.detail,
        "exit_code": getattr(e, "exit_code", None),
        "score": 0
      })
      failed_count += 1
    except SegmentationFaultException as e:
      results.append({
        "test_case": test_id,
        "status": "segmentation_fault",
        "output": "",
        "error_message": e.detail,
        "exit_code": getattr(e, "exit_code", None),
        "score": 0
      })
      failed_count += 1
    except Exception as e:
      results.append({
        "test_case": test_id,
        "status": "error",
        "output": "",
        "error_message": str(e),
        "exit_code": None,
        "score": 0
      })
      failed_count += 1

  try:
    for root, dirs, files in os.walk(user_dir, topdown=False):
      for name in files:
        os.remove(os.path.join(root, name))
      for name in dirs:
        os.rmdir(os.path.join(root, name))
    os.rmdir(user_dir)
  except Exception as cleanup_err:
    logging.warning(
      f"Failed to clean up directory {user_dir}: {cleanup_err}"
    )

  return {
    "results": results,
    "summary": {
      "passed": passed_count,
      "failed": failed_count,
      "total": len(testcases),
      "total_score": total_score
    }
  }
