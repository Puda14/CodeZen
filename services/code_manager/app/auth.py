from fastapi import Request, HTTPException, Depends # type: ignore
from jose import JWTError, jwt # type: ignore
import os
from dotenv import load_dotenv # type: ignore

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")

def decode_jwt_token(token: str):
  try:
    payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    return payload
  except JWTError:
    raise HTTPException(status_code=401, detail="Invalid or expired token.")

async def jwt_auth_dependency(request: Request):
  internal_key = request.headers.get("x-internal-api-key")
  if internal_key and internal_key == os.getenv("INTERNAL_API_KEY"):
    return {"_id": "internal_service", "role": "internal"}

  auth_header = request.headers.get("x-access-token")
  if not auth_header:
    raise HTTPException(status_code=401, detail="Authorization header missing.")

  token = auth_header.split(" ")[1] if " " in auth_header else auth_header
  return decode_jwt_token(token)
