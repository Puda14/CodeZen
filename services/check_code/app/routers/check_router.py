from typing import List

import requests
from fastapi import APIRouter, Depends # type: ignore

from app.auth import jwt_auth_dependency
from app.core.check_pipeline import SemanticSimilarityPipeline
from app.models.schemas import UserData

router = APIRouter()


# curl -N -X GET http://localhost:8080/api/check/
@router.get("/")
def health_check():
  return {"message": "Check Code Service is running"}


@router.post("/semantic-code")
async def check_semantic_code(
  body: List[UserData],
  user=Depends(jwt_auth_dependency)
):
  pipeline = SemanticSimilarityPipeline()
  result = pipeline.run(body)
  return {"results": result}
