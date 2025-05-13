PROMPT_TEMPLATES = {
"analyze_problem": """
You are a programming problem analyzer. Given the problem description below, extract and return the following structured information in valid JSON format:

- Description: [A concise summary of the problem in natural language]
- Input: [Explain the input format in words]
- Output: [Explain the expected output format in words]
- Constraints: [List each constraint as a separate bullet point, in plain text, no LaTeX]

Problem Description:
{content}

Return only valid JSON.
""",

"analyze_code": """
You are a code analyst for competitive programming problems. Given the solution code below, analyze and return the following structured information:

- MainIdea: [Summarize the main algorithmic idea in plain words]
- StepByStepLogic: [Explain how the code works step by step]
- TimeComplexity: [State the time complexity in Big-O notation]
- EdgeHandling: [Mention how edge cases are handled, if any]

Solution Code:
{content}

Return only valid JSON.
""",

"generate_cases": """
You are tasked with generating ideas for test cases based on the problem description and solution summary.

### Definitions:
- **Basic cases**: Test normal behavior of the algorithm on typical inputs.
- **Edge cases**: Special or boundary conditions such as minimum/maximum values, empty input, all elements equal, etc.
- **Stress cases**: Large-scale or complex scenarios designed to test performance and scalability.

### Instructions:
1. Return a JSON object with three keys: `"basic"`, `"edge"`, and `"stress"`.
2. Each key maps to an array of strings, where each string describes a test case idea.
3. Avoid vague descriptions like “test random numbers” — be specific about structure and purpose.

Provide the result in JSON format:
{{
  "basic": ["description1", "description2"],
  "edge": ["description1", "description2"],
  "stress": ["description1", "description2"]
}}

Problem Description:
{problem_description}

Solution Summary:
{solution_summary}

Do not give examples. Only return JSON.
""",

"synthesize_testcases": """
You are tasked to generate a **C++ code snippet** that produces the test case **input only**, based on the given test case description.

### Strict Instructions:
1. **Mandatory includes**:
   - Always include `#include <iostream>` and `#include <vector>`.
   - If using random number generation (e.g., `std::random_device`, `std::mt19937`, `std::uniform_int_distribution`), you must also include `#include <random>`.
   - If using `std::shuffle`, you must also include `#include <algorithm>`.
   - Always explicitly include all necessary headers. Do not rely on implicit behavior.
2. **Code structure**:
   - The code must only print the **input data** using `std::cout`.
   - Do **NOT** use `cin` or read any input.
   - Do **NOT** add output validation or expected answer code.
   - Use `std::endl` or `\\n` correctly to format the output.
3. **Random generation cases**:
   - Use appropriate `std::random_device`, `std::mt19937`, and distributions if the case involves random data.
   - Always seed random generators properly (`std::random_device` or a fixed seed if specified).
4. **Formatting and style**:
   - The code must be fully compilable in `C++17` or later (preferably `C++20` or `C++23`).
   - No unnecessary comments, extra functions, or explanations inside the code.
   - Only pure data generation code.
5. **Output format**:
   - Return a **JSON object** with the following fields:
     - `"input"`: String containing the exact C++ code.
     - `"category"`: One of `"basic"`, `"edge"`, `"stress"`.
     - `"explanation"`: Clear explanation of why this test case is meaningful:
       - What behavior, boundary, or performance aspect it tests.
       - Avoid copying the test description directly.
       - Avoid vague statements like "it tests correctness" — be specific about the pattern (e.g., "tests the performance of the LIS algorithm on a strictly decreasing array where LIS length is 1").
6. **Context information**:
   - Use the provided **test case description** as the only basis.
   - Reference the **input format** and **output format** if needed for correctness.

### Example JSON response:
{{
  "input": "<C++ code that generates input>",
  "category": "<basic|edge|stress>",
  "explanation": "<Clear and specific reason why this test case is meaningful>"
}}

### Provided context:
- Testcase Description:
{content}

- Input Format:
{input_format}

- Output Format:
{output_format}

### Important:
Always double-check that the generated code has:
- All necessary `#include` directives.
- No compile errors.
- Correct formatting matching the input format.
"""
}
