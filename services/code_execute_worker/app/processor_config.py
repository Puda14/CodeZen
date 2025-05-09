def get_timeout_wrapper(user_dir, timeout_sec):
  """
  Build the timeout + time tracking command string.
  """
  return (
    f"/usr/bin/time -o {user_dir}/time.txt -f '%e' "
    f"timeout {timeout_sec}"
  )


PROCESSOR_CONFIG = {
  "cpp": {
    "image": "puda14/codezen-gcc:latest",
    "code_filename": "main.cpp",
    "needs_compile": True,
    "compile_command": lambda user_dir: (
      f"g++ -o main {user_dir}/main.cpp"
    ),
    "run_command": lambda user_dir: (
      f"./main < {user_dir}/input.txt"
    ),
    "final_command": lambda user_dir, timeout_sec: (
      f"{get_timeout_wrapper(user_dir, timeout_sec)} "
      f"./main < {user_dir}/input.txt > {user_dir}/output.txt"
    )
  },

  "python": {
    "image": "puda14/codezen-python:latest",
    "code_filename": "main.py",
    "needs_compile": False,
    "compile_command": lambda user_dir: "",
    "run_command": lambda user_dir: (
      f"python {user_dir}/main.py < {user_dir}/input.txt"
    ),
    "final_command": lambda user_dir, timeout_sec: (
      f"{get_timeout_wrapper(user_dir, timeout_sec)} "
      f"python {user_dir}/main.py < {user_dir}/input.txt "
      f"> {user_dir}/output.txt"
    )
  },

}
