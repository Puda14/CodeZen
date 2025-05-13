from fastapi import Request, HTTPException, Depends  # type: ignore
from jose import JWTError, jwt # type: ignore
import os
from dotenv import load_dotenv  # type: ignore

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")
INTERNAL_API_KEY = os.getenv(
  "INTERNAL_API_KEY",
  "your-very-secret-internal-key"
)

def decode_jwt_token(token: str):
  try:
    payload = jwt.decode(
      token,
      JWT_SECRET,
      algorithms=["HS256"]
    )
    return payload
  except JWTError:
    raise HTTPException(
      status_code=401,
      detail="Invalid or expired token."
    )

async def jwt_auth_dependency(request: Request):
  internal_key = request.headers.get("x-internal-api-key")
  jwt_token = request.headers.get("x-access-token")

  if internal_key:
    if internal_key == INTERNAL_API_KEY:
      return {"type": "internal"}
    raise HTTPException(
      status_code=401,
      detail="Invalid internal API key."
    )

  if jwt_token:
    token = (
      jwt_token.split(" ")[1]
      if " " in jwt_token else jwt_token
    )
    return decode_jwt_token(token)

  raise HTTPException(
    status_code=401,
    detail="Authorization header missing or invalid."
  )
