import os
import uuid
import logging
import subprocess

from app.processor_config import PROCESSOR_CONFIG

BASE_DIR = os.path.abspath("/tmp/code_manager")

logging.basicConfig(level=logging.INFO)


def save_code_and_input(code: str, input_data: str, processor: str) -> str:
  """
  Save user code and input data to a temporary directory.
  Returns the path to the saved directory.
  """
  os.makedirs(BASE_DIR, exist_ok=True)

  unique_id = str(uuid.uuid4())
  user_dir = os.path.join(BASE_DIR, unique_id)

  os.makedirs(user_dir, exist_ok=True)

  if processor not in PROCESSOR_CONFIG:
    raise ValueError(f"Unsupported processor: {processor}")

  code_filename = PROCESSOR_CONFIG[processor]["code_filename"]
  code_path = os.path.join(user_dir, code_filename)

  try:
    with open(code_path, "w") as code_file:
      code_file.write(code)
  except Exception as e:
    logging.error(f"Failed to save code file: {e}")

  input_path = os.path.join(user_dir, "input.txt")
  try:
    with open(input_path, "w") as input_file:
      input_file.write(input_data)
  except Exception as e:
    logging.error(f"Failed to save input file: {e}")

  logging.info(f"Contents of {user_dir}: {os.listdir(user_dir)}")

  return user_dir


def create_user_workdir():
  """
  Create a unique working directory under /tmp/code_manager.
  Returns the full path.
  """
  os.makedirs(BASE_DIR, exist_ok=True)

  unique_id = str(uuid.uuid4())
  user_dir = os.path.join(BASE_DIR, unique_id)
  os.makedirs(user_dir, exist_ok=True)

  logging.info(f"Created working directory: {user_dir}")
  return user_dir


def save_code(code: str, processor: str, user_dir: str):
  if processor not in PROCESSOR_CONFIG:
    raise ValueError(f"Unsupported processor: {processor}")

  code_filename = PROCESSOR_CONFIG[processor]["code_filename"]
  code_path = os.path.join(user_dir, code_filename)

  try:
    with open(code_path, "w") as code_file:
      code_file.write(code)
    logging.info(f"Code saved to {code_path}")
  except Exception as e:
    logging.error(f"Failed to save code file: {e}")


def save_input(input_data: str, user_dir: str):
  input_path = os.path.join(user_dir, "input.txt")
  try:
    with open(input_path, "w") as input_file:
      input_file.write(input_data)
    logging.info(f"Input saved to {input_path}")
  except Exception as e:
    logging.error(f"Failed to save input file: {e}")
