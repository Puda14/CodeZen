from fastapi import HTTPException # type: ignore

class CodeExecutionException(HTTPException):
  """
  Custom exception for errors during code execution.
  """
  def __init__(self, status_code: int = 500, detail: str = "An error occurred during code execution"):
    super().__init__(status_code=status_code, detail=detail)

class FileNotFoundException(CodeExecutionException):
  """
  Exception for missing files in the directory.
  """
  def __init__(self, file_path: str):
    detail = f"File not found: {file_path}"
    super().__init__(status_code=404, detail=detail)

class InvalidProcessorConfigurationException(CodeExecutionException):
  """
  Exception for invalid or missing processor configuration.
  """
  def __init__(self, processor: str):
    detail = f"Invalid configuration for processor: {processor}"
    super().__init__(status_code=400, detail=detail)

class DockerNotAvailableException(CodeExecutionException):
  """
  Exception for Docker daemon not available.
  """
  def __init__(self):
    detail = "Docker daemon is not available or not running."
    super().__init__(status_code=503, detail=detail)

class DockerExecutionTimeoutException(CodeExecutionException):
  """
  Exception for container execution timeout.
  """
  def __init__(self):
    detail = "Docker container execution timed out."
    super().__init__(status_code=408, detail=detail)

class UnsupportedLanguageException(CodeExecutionException):
  """
  Exception for unsupported programming languages.
  """
  def __init__(self, language: str):
    detail = f"Unsupported programming language: {language}"
    super().__init__(status_code=400, detail=detail)

class CompilationErrorException(CodeExecutionException):
  """
  Exception for compilation errors in code execution.
  """
  def __init__(self, logs: str):
    detail = f"Compilation Error: {logs}"
    super().__init__(status_code=400, detail=detail)

class RuntimeErrorException(CodeExecutionException):
  """
  Exception for runtime errors in code execution.
  """
  def __init__(self, logs: str):
    detail = f"Runtime Error: {logs}"
    super().__init__(status_code=400, detail=detail)

class TimeLimitExceededException(CodeExecutionException):
  """
  Exception for time limit exceeded during code execution.
  """
  def __init__(self):
    detail = "Time Limit Exceeded: Code execution took too long"
    super().__init__(status_code=408, detail=detail)

class MemoryLimitExceededException(CodeExecutionException):
  """
  Exception for memory limit exceeded during code execution.
  """
  def __init__(self):
    detail = "Memory Limit Exceeded: Code execution used too much memory"
    super().__init__(status_code=400, detail=detail)

class SegmentationFaultException(CodeExecutionException):
  """
  Exception for segmentation faults during code execution.
  """
  def __init__(self, logs: str):
    detail = f"Segmentation Fault"
    super().__init__(status_code=500, detail=detail)