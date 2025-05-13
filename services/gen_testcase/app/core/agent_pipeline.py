from app.models.gemini_client import (
  query_gemini_text,
  query_gemini_structured
)
from app.models.ollama_client import (
  query_ollama_structured
)
from app.models.schemas import (
  ProblemInfo,
  CodeAnalysis,
  CaseGroup,
  Testcase
)
from app.core.prompt_templates import PROMPT_TEMPLATES
import time


def call_llm(agent_type: str, **kwargs):
  prompt = PROMPT_TEMPLATES[agent_type].format(**kwargs)

  if agent_type == "analyze_problem":
    return query_gemini_structured(prompt, ProblemInfo)

  if agent_type == "analyze_code":
    return query_gemini_structured(prompt, CodeAnalysis)

  if agent_type == "generate_cases":
    return query_gemini_structured(prompt, CaseGroup)

  if agent_type == "synthesize_testcases":
    return query_gemini_structured(prompt, Testcase)

  return query_gemini_text(prompt)


class TestcaseGenerationPipeline:
  def __init__(self):
    pass

  def run(
    self,
    problem_description: str,
    solution_code: str,
    processor: str = "c++23"
  ):
    # Step 1: Analyze problem
    problem_info = call_llm(
      "analyze_problem",
      content=problem_description
    )
    yield {
      "step": "analyze_problem",
      "data": problem_info.dict()
    }

    # Step 2: Analyze solution code
    code_analysis = call_llm(
      "analyze_code",
      content=solution_code
    )
    yield {
      "step": "analyze_code",
      "data": code_analysis.dict()
    }

    # Step 3: Generate case descriptions
    case_group = call_llm(
      "generate_cases",
      problem_description=problem_description,
      solution_summary=code_analysis.StepByStepLogic
    )
    yield {
      "step": "generate_cases",
      "data": case_group.dict()
    }

    # Step 4: Synthesize testcases
    for category in ["basic", "edge", "stress"]:
      descriptions = getattr(case_group, category)
      for desc in descriptions:
        testcase = call_llm(
          "synthesize_testcases",
          content=desc,
          input_format=problem_info.Input,
          output_format=problem_info.Output
        )
        testcase.category = category
        yield {
          "step": "synthesize_testcase",
          "data": testcase.dict()
        }
        time.sleep(4)
