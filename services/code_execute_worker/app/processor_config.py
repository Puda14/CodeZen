def get_timeout_wrapper(user_dir, timeout_sec):
  """
  Build the timeout + time tracking command string.
  """
  return (
    f"/usr/bin/time -o {user_dir}/time.txt -f '%e' "
    f"timeout {timeout_sec}"
  )


PROCESSOR_CONFIG = {
  "c": {
    "image": "puda14/codezen-gcc:latest",
    "language": "c",
    "code_filename": "main.c",
    "needs_compile": True,
    "compile_command": lambda user_dir: (
      f"gcc -o main {user_dir}/main.c"
    ),
    "run_command": lambda user_dir: (
      f"./main < {user_dir}/input.txt"
    ),
    "final_command": lambda user_dir, timeout_sec: (
      f"{get_timeout_wrapper(user_dir, timeout_sec)} "
      f"./main < {user_dir}/input.txt > {user_dir}/output.txt"
    )
  },

  "c++11": {
    "image": "puda14/codezen-gcc:latest",
    "language": "cpp",
    "code_filename": "main.cpp",
    "needs_compile": True,
    "compile_command": lambda user_dir: (
      f"g++ -std=c++11 -o main {user_dir}/main.cpp"
    ),
    "run_command": lambda user_dir: (
      f"./main < {user_dir}/input.txt"
    ),
    "final_command": lambda user_dir, timeout_sec: (
      f"{get_timeout_wrapper(user_dir, timeout_sec)} "
      f"./main < {user_dir}/input.txt > {user_dir}/output.txt"
    )
  },

  "c++14": {
    "image": "puda14/codezen-gcc:latest",
    "language": "cpp",
    "code_filename": "main.cpp",
    "needs_compile": True,
    "compile_command": lambda user_dir: (
      f"g++ -std=c++14 -o main {user_dir}/main.cpp"
    ),
    "run_command": lambda user_dir: (
      f"./main < {user_dir}/input.txt"
    ),
    "final_command": lambda user_dir, timeout_sec: (
      f"{get_timeout_wrapper(user_dir, timeout_sec)} "
      f"./main < {user_dir}/input.txt > {user_dir}/output.txt"
    )
  },

  "c++17": {
    "image": "puda14/codezen-gcc:latest",
    "language": "cpp",
    "code_filename": "main.cpp",
    "needs_compile": True,
    "compile_command": lambda user_dir: (
      f"g++ -std=c++17 -o main {user_dir}/main.cpp"
    ),
    "run_command": lambda user_dir: (
      f"./main < {user_dir}/input.txt"
    ),
    "final_command": lambda user_dir, timeout_sec: (
      f"{get_timeout_wrapper(user_dir, timeout_sec)} "
      f"./main < {user_dir}/input.txt > {user_dir}/output.txt"
    )
  },

  "c++20": {
    "image": "puda14/codezen-gcc:latest",
    "language": "cpp",
    "code_filename": "main.cpp",
    "needs_compile": True,
    "compile_command": lambda user_dir: (
      f"g++ -std=c++20 -o main {user_dir}/main.cpp"
    ),
    "run_command": lambda user_dir: (
      f"./main < {user_dir}/input.txt"
    ),
    "final_command": lambda user_dir, timeout_sec: (
      f"{get_timeout_wrapper(user_dir, timeout_sec)} "
      f"./main < {user_dir}/input.txt > {user_dir}/output.txt"
    )
  },

  "c++23": {
    "image": "puda14/codezen-gcc:latest",
    "language": "cpp",
    "code_filename": "main.cpp",
    "needs_compile": True,
    "compile_command": lambda user_dir: (
      f"g++ -std=c++23 -o main {user_dir}/main.cpp"
    ),
    "run_command": lambda user_dir: (
      f"./main < {user_dir}/input.txt"
    ),
    "final_command": lambda user_dir, timeout_sec: (
      f"{get_timeout_wrapper(user_dir, timeout_sec)} "
      f"./main < {user_dir}/input.txt > {user_dir}/output.txt"
    )
  },

  "python3": {
    "image": "puda14/codezen-python:latest",
    "language": "python",
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
  "java": {
    "image": "puda14/codezen-openjdk:latest",
    "language": "java",
    "code_filename": "Main.java",
    "needs_compile": True,
    "compile_command": lambda user_dir: (
      f"javac {user_dir}/Main.java"
    ),
    "run_command": lambda user_dir: (
      f"java -cp {user_dir} Main < {user_dir}/input.txt"
    ),
    "final_command": lambda user_dir, timeout_sec: (
      f"{get_timeout_wrapper(user_dir, timeout_sec)} "
      f"java -cp {user_dir} Main < {user_dir}/input.txt "
      f"> {user_dir}/output.txt"
    )
  },

  "ruby": {
    "image": "puda14/codezen-ruby:latest",
    "language": "ruby",
    "code_filename": "main.rb",
    "needs_compile": False,
    "compile_command": lambda user_dir: "",
    "run_command": lambda user_dir: (
      f"ruby {user_dir}/main.rb < {user_dir}/input.txt"
    ),
    "final_command": lambda user_dir, timeout_sec: (
      f"{get_timeout_wrapper(user_dir, timeout_sec)} "
      f"ruby {user_dir}/main.rb < {user_dir}/input.txt "
      f"> {user_dir}/output.txt"
    )
  },

  "golang": {
    "image": "puda14/codezen-golang:latest",
    "language": "golang",
    "code_filename": "main.go",
    "needs_compile": True,
    "compile_command": lambda user_dir: (
      f"go build -o {user_dir}/main {user_dir}/main.go"
    ),
    "run_command": lambda user_dir: (
      f"{user_dir}/main < {user_dir}/input.txt"
    ),
    "final_command": lambda user_dir, timeout_sec: (
      f"{get_timeout_wrapper(user_dir, timeout_sec)} "
      f"{user_dir}/main < {user_dir}/input.txt "
      f"> {user_dir}/output.txt"
    )
  },

  "c#": {
    "image": "puda14/codezen-sharp:latest",
    "language": "csharp",
    "code_filename": "Program.cs",
    "needs_compile": True,
    "compile_command": lambda user_dir: (
      f"mcs -out:{user_dir}/main.exe {user_dir}/Program.cs"
    ),
    "run_command": lambda user_dir: (
      f"mono {user_dir}/main.exe < {user_dir}/input.txt"
    ),
    "final_command": lambda user_dir, timeout_sec: (
      f"{get_timeout_wrapper(user_dir, timeout_sec)} "
      f"mono {user_dir}/main.exe < {user_dir}/input.txt "
      f"> {user_dir}/output.txt"
    )
  },

  "javascript": {
    "image": "puda14/codezen-node:latest",
    "language": "javascript",
    "code_filename": "main.js",
    "needs_compile": False,
    "compile_command": lambda user_dir: "",
    "run_command": lambda user_dir: (
      f"node {user_dir}/main.js < {user_dir}/input.txt"
    ),
    "final_command": lambda user_dir, timeout_sec: (
      f"{get_timeout_wrapper(user_dir, timeout_sec)} "
      f"node {user_dir}/main.js < {user_dir}/input.txt "
      f"> {user_dir}/output.txt"
    )
  },

  "pascal": {
    "image": "puda14/codezen-pascal:latest",
    "language": "pascal",
    "code_filename": "main.pas",
    "needs_compile": True,
    "compile_command": lambda user_dir: (
      f"fpc -o{user_dir}/main {user_dir}/main.pas"
    ),
    "run_command": lambda user_dir: (
      f"{user_dir}/main < {user_dir}/input.txt"
    ),
    "final_command": lambda user_dir, timeout_sec: (
      f"{get_timeout_wrapper(user_dir, timeout_sec)} "
      f"{user_dir}/main < {user_dir}/input.txt "
      f"> {user_dir}/output.txt"
    )
  }
}
