from fastapi import FastAPI # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from fastapi.responses import ORJSONResponse # type: ignore
from app.routers.check_router import router as check_semantic_code_router
from fastapi.exceptions import RequestValidationError # type: ignore
from fastapi.responses import JSONResponse # type: ignore
from fastapi import Request # type: ignore

app = FastAPI(default_response_class=ORJSONResponse)

app.include_router(check_semantic_code_router)
