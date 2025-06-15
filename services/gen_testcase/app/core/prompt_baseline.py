PROMPT_BASE_LINE = """You are a competitive programming assistant.

Given the following problem description and a brief solution summary, generate **6 test case ideas** that cover:
- Normal situations
- Edge cases
- Performance or stress conditions

Only return a numbered list of test case descriptions in natural language. Do not write any code or explanation.

### Problem Description:
{problem_description}

### Solution Summary:
{solution_summary}

List:
1.
2.
3.
4.
5.
6.
"""
