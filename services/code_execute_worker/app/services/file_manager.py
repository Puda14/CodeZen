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
  # If needed, change the permissions
  # os.chmod(user_dir, 0o777)

  if processor not in PROCESSOR_CONFIG:
    raise ValueError(f"Unsupported processor: {processor}")
  
  code_filename = PROCESSOR_CONFIG[processor]["code_filename"]
  code_path = os.path.join(user_dir, code_filename)

  try:
    with open(code_path, "w") as code_file:
      code_file.write(code)
      
      # Flush the file to ensure that the contents are written to disk
      
      # code_file.flush()
      # os.fsync(code_file.fileno())
      # subprocess.run(["sync"], check=True)

    # DEBUG:
    #   try:
    #     result = subprocess.run(
    #       ["cat", code_path],
    #       stdout=subprocess.PIPE,
    #       stderr=subprocess.PIPE,
    #       text=True
    #     )
    #     if result.returncode == 0:
    #       logging.info(f"Content of {code_path}: \n{result.stdout}")
    #     else:
    #       logging.error(f"Failed to read {code_path} using cat: {result.stderr}")
    #   except Exception as e:
    #     logging.error(f"Error while running cat on {code_path}: {e}")
    # logging.info(f"Code file saved: {code_path}")
    # logging.info(f"Contents of {user_dir} immediately after writing files: {os.listdir(user_dir)}")
    # logging.info(f"Absolute path of code_path: {os.path.abspath(code_path)}")

  except Exception as e:
    logging.error(f"Failed to save code file: {e}")

  # Save input file (optional)
  input_path = os.path.join(user_dir, "input.txt")
  try:
    with open(input_path, "w") as input_file:
      input_file.write(input_data)
    # logging.info(f"Input file saved: {input_path}")
  except Exception as e:
    logging.error(f"Failed to save input file: {e}")

  # Verify contents of the directory
  logging.info(f"Contents of {user_dir}: {os.listdir(user_dir)}")

  return user_dir
