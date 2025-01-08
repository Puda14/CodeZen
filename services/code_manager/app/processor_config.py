PROCESSOR_CONFIG = {
  "cpp": {
    "image": "gcc:latest",
    "code_filename": "main.cpp",
    "compile_command": lambda user_dir: f"g++ -o main {user_dir}/main.cpp",
    "run_command": lambda user_dir: f"timeout 1 ./main < {user_dir}/input.txt"
  },
  "python": {
    "image": "python:3.9-slim",
    "code_filename": "main.py",
    "compile_command": lambda user_dir: "", 
    "run_command": lambda user_dir: f"timeout 1 python {user_dir}/main.py < {user_dir}/input.txt"
  },
}
