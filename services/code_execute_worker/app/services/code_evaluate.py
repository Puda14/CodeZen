import os
import json
import logging

from app.services.file_manager import save_code_and_input
from app.services.docker_handler import run_code_in_docker
from app.processor_config import PROCESSOR_CONFIG
from app.exceptions import CodeExecutionException, UnsupportedLanguageException

async def evaluate_code(request):
  if request.processor not in PROCESSOR_CONFIG:
    raise UnsupportedLanguageException(request.processor)

  testcases = getattr(request, "testcases", None)
  if not testcases or not isinstance(testcases, list):
    raise ValueError("No testcases provided in request.")

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

    user_dir = save_code_and_input(
      code=request.code,
      input_data=input_data,
      processor=request.processor
    )

    try:
      result = run_code_in_docker(user_dir=user_dir, processor=request.processor).rstrip(' \n\r')

      if result == expected_result:
        results.append({
          "test_case": test_id,
          "status": "passed",
          "output": result,
          "score": score
        })
        passed_count += 1
        total_score += score
      else:
        res = {
          "test_case": test_id,
          "status": "failed",
          "output": result,
          "score": 0
        }
        if is_public:
          res["expected"] = expected_result
        results.append(res)
        failed_count += 1

    except CodeExecutionException as e:
      results.append({
        "test_case": test_id,
        "status": "error",
        "error_message": e.detail,
        "score": 0
      })
      failed_count += 1
    except Exception as e:
      results.append({
        "test_case": test_id,
        "status": "error",
        "error_message": str(e),
        "score": 0
      })
      failed_count += 1
    finally:
      if os.path.exists(user_dir):
        for root, dirs, files in os.walk(user_dir, topdown=False):
          for name in files:
            os.remove(os.path.join(root, name))
          for name in dirs:
            os.rmdir(os.path.join(root, name))
        os.rmdir(user_dir)

  return {
    "results": results,
    "summary": {
      "passed": passed_count,
      "failed": failed_count,
      "total": len(testcases),
      "total_score": total_score
    }
  }
