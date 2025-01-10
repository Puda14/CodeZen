import os
import docker  # type: ignore
import logging
from app.exceptions import (
  CompilationErrorException,
  RuntimeErrorException,
  TimeLimitExceededException,
  MemoryLimitExceededException,
  FileNotFoundException,
  DockerNotAvailableException,
  SegmentationFaultException
)

from app.processor_config import PROCESSOR_CONFIG

logging.basicConfig(level=logging.INFO)

def run_code_in_docker(user_dir: str, processor: str):
  """
  Executes the user-provided code inside a Docker container with the specified processor.
  Raises specific exceptions for errors.
  """
  client = docker.from_env()

  try:
    logging.info("Starting Docker container...")

    config = PROCESSOR_CONFIG[processor]
    image = config["image"]
    compile_command = config.get("compile_command", lambda _: "")(user_dir)
    run_command = config["run_command"](user_dir)

    code_file = os.path.join(user_dir, config["code_filename"])
    if not os.path.exists(code_file):
      raise FileNotFoundException(code_file)

    try:
      client.ping()
    except Exception:
      raise DockerNotAvailableException()

    container_ulimits = [
      docker.types.Ulimit(name="nofile", soft=1024, hard=2048),
      docker.types.Ulimit(name="nproc", soft=50, hard=100),
    ]

    # Step 1: Compile the code
    if compile_command:
      try:
        logging.info("Compiling code...")
        compile_logs = client.containers.run(
          image=image,
          command=f"bash -c '{compile_command}'",
          volumes={user_dir: {"bind": f"{user_dir}", "mode": "rw"}},
          working_dir=f"{user_dir}",
          network_disabled=True,
          stderr=True,
          stdout=True,
          remove=True,
        )
        logging.info(f"Compilation successful: {compile_logs.decode('utf-8')}")
      except docker.errors.ContainerError as e:
        logs = e.stderr.decode("utf-8")
        logging.error(f"Compilation error: {logs}")
        raise CompilationErrorException(logs)

    # Step 2: Execute the code
    try:
      logging.info("Running code...")
      run_logs = client.containers.run(
        image=image,
        command=f"bash -c '{run_command}'",
        volumes={user_dir: {"bind": f"{user_dir}", "mode": "rw"}},
        working_dir=f"{user_dir}",
        network_disabled=True,
        mem_limit="300m",
        mem_reservation="200m",
        memswap_limit="300m",
        mem_swappiness=0,
        cpu_period=100000,
        cpu_quota=100000,  # Total 1 CPU
        pids_limit=50,
        privileged=False,
        detach=False,
        stderr=True,
        stdout=True,
        remove=True,
        ulimits=container_ulimits,
      )
      logs_decoded = run_logs.decode("utf-8")

      logging.info("Execution successful.")
      return logs_decoded

    except docker.errors.ContainerError as e:
      logs = e.stderr.decode("utf-8")
      exit_code = e.exit_status
      logging.error(f"EXIT CODE: {exit_code}")

      if exit_code == 124:
        raise TimeLimitExceededException()
      elif exit_code == 137:
        raise MemoryLimitExceededException()
      elif exit_code == 139:
        raise SegmentationFaultException(logs)
      elif exit_code in [126, 127]:
        raise FileNotFoundException(logs)
      else:
        raise RuntimeErrorException(logs)

  except Exception as e:
    logging.error(f"Unexpected error: {e}")
    raise
