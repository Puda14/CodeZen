from pydantic import BaseModel # type: ignore
from typing import List, Literal


class ProblemInfo(BaseModel):
    Description: str
    Input: str
    Output: str
    Constraints: List[str]


class CodeAnalysis(BaseModel):
    MainIdea: str
    StepByStepLogic: str
    TimeComplexity: str
    EdgeHandling: str


class CaseGroup(BaseModel):
    basic: List[str]
    edge: List[str]
    stress: List[str]


class Testcase(BaseModel):
    input: str
    category: Literal["basic", "edge", "stress"]
    explanation: str
