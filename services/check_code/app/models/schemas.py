from pydantic import BaseModel, Field  # type: ignore
from typing import List


class Submission(BaseModel):
  id: str = Field(..., alias="_id")
  code: str
  language: str
  processor: str
  score: float


class ProblemInfo(BaseModel):
  id: str = Field(..., alias="_id")
  name: str


class ProblemData(BaseModel):
  problem: ProblemInfo
  submissions: List[Submission]


class UserInfo(BaseModel):
  id: str = Field(..., alias="_id")
  username: str
  email: str


class UserData(BaseModel):
  user: UserInfo
  problems: List[ProblemData]
