import os
import docker  # type: ignore
import logging
import time

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

def compile_code_in_docker(user_dir: str, processor: str):
  client = docker.from_env()
  config = PROCESSOR_CONFIG[processor]
  image = config["image"]
  compile_command = config.get("compile_command", lambda _: "")(
    user_dir
  )

  if not compile_command:
    logging.info("No compile command needed.")
    return

  logging.info("Compiling code once...")
  try:
    client.ping()
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
    logging.info(
      f"Compilation successful: {compile_logs.decode('utf-8')}"
    )
  except docker.errors.ContainerError as e:
    logs = e.stderr.decode("utf-8")
    logging.error(f"Compilation error: {logs}")
    raise CompilationErrorException(logs, exit_code=e.exit_status)


def run_code_in_docker(user_dir: str, processor: str):
  """
  Executes user-provided code inside a Docker container.
  Raises specific exceptions for errors.
  """
  client = docker.from_env()

  try:
    logging.info("Starting Docker container...")

    config = PROCESSOR_CONFIG[processor]
    image = config["image"]

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

    logging.info("Running code...")

    run_logs = client.containers.run(
      image=image,
      command=f"bash -c '{config['final_command'](user_dir)}'",
      volumes={user_dir: {"bind": f"{user_dir}", "mode": "rw"}},
      working_dir=f"{user_dir}",
      network_disabled=True,
      mem_limit="300m",
      mem_reservation="200m",
      memswap_limit="300m",
      mem_swappiness=0,
      cpu_period=100000,
      cpu_quota=100000,
      pids_limit=50,
      privileged=False,
      detach=False,
      stderr=True,
      stdout=True,
      remove=True,
      ulimits=container_ulimits,
    )

    output_path = os.path.join(user_dir, "output.txt")
    time_path = os.path.join(user_dir, "time.txt")

    try:
      with open(output_path, "r") as f:
        logs_decoded = f.read().strip()
    except Exception as e:
      logging.warning(f"Failed to read program output: {e}")
      logs_decoded = ""

    try:
      with open(time_path, "r") as f:
        elapsed_time = float(f.read().strip())
    except Exception as e:
      logging.warning(f"Failed to parse elapsed time: {e}")
      elapsed_time = None

    if elapsed_time is not None:
      logging.info(
        f"Execution successful. Time: {elapsed_time:.4f}s"
      )
    else:
      logging.info(
        "Execution successful. Elapsed time not determined."
      )

    return logs_decoded, elapsed_time

  except docker.errors.ContainerError as e:
    logs = e.stderr.decode("utf-8")
    exit_code = e.exit_status
    logging.error(f"EXIT CODE: {exit_code}")

    if exit_code == 124:
      raise TimeLimitExceededException(exit_code=exit_code)
    elif exit_code == 137:
      raise MemoryLimitExceededException(exit_code=exit_code)
    elif exit_code == 139:
      raise SegmentationFaultException(logs, exit_code=exit_code)
    elif exit_code in [126, 127]:
      raise FileNotFoundException(logs, exit_code=exit_code)
    else:
      raise RuntimeErrorException(logs, exit_code=exit_code)

  except Exception as e:
    logging.error(f"Unexpected error: {e}")
    raise
