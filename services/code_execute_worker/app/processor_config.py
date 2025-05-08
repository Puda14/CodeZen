TIMEOUT_TIME_WRAPPER = '/usr/bin/time -o {user_dir}/time.txt -f "%e" timeout 1'

PROCESSOR_CONFIG = {
    "cpp": {
        "image": "puda14/codezen-gcc:latest",
        "code_filename": "main.cpp",
        "needs_compile": True,
        "compile_command": lambda user_dir: f"g++ -o main {user_dir}/main.cpp",
        "run_command": lambda user_dir: f"./main < {user_dir}/input.txt",
        "final_command": lambda user_dir: (
          f"{TIMEOUT_TIME_WRAPPER.format(user_dir=user_dir)} ./main < {user_dir}/input.txt > {user_dir}/output.txt"
        )
    },
    "python": {
        "image": "puda14/codezen-python:latest",
        "code_filename": "main.py",
        "needs_compile": False,
        "compile_command": lambda user_dir: "",
        "run_command": lambda user_dir: f"python {user_dir}/main.py < {user_dir}/input.txt",
        "final_command": lambda user_dir: (
          f"{TIMEOUT_TIME_WRAPPER.format(user_dir=user_dir)} python {user_dir}/main.py < {user_dir}/input.txt > {user_dir}/output.txt"
        )
    },
}
