import redis # type: ignore
import os
import json
from fastapi import HTTPException # type: ignore

redis_client = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

def get_contest_data(contest_id: str) -> dict:
  key = f"contest_{contest_id}"
  raw = redis_client.get(key)

  if not raw:
    raise HTTPException(status_code=403, detail=f"Contest {contest_id} is not currently active or not within the allowed contest time.")

  try:
    data = json.loads(raw)
    if "value" in data:
      return data["value"]
    return data
  except json.JSONDecodeError:
    raise HTTPException(status_code=500, detail="Invalid contest data format in Redis.")

def is_user_approved(contest: dict, user_id: str) -> bool:
  registrations = contest.get("registrations", [])
  print(f"Registrations: {registrations}")
  print(f"User ID: {user_id}")
  for reg in registrations:
    if reg["user"]["_id"] == user_id and reg["status"] == "approved":
      return True
  return False

def get_problem_testcases(contest: dict, problem_id: str) -> list:
  problem = next((p for p in contest.get("problems", []) if p["_id"] == problem_id), None)
  if not problem:
    raise HTTPException(status_code=404, detail="Problem not found in contest.")

  testcases = problem.get("testcases", [])
  if not testcases:
    raise HTTPException(status_code=400, detail="No testcases found for the problem.")
  return testcases

def get_problem_max_submissions(contest: dict, problem_id: str) -> int:
    problem = next((p for p in contest.get("problems", []) if p["_id"] == problem_id), None)
    if not problem:
      raise HTTPException(status_code=404, detail="Problem not found in contest.")
    max_submissions = problem.get("maxSubmissions", 0)
    return max_submissions
