from fastapi import FastAPI # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from app.routers.testcase_router import router as testcase_router
from fastapi.responses import ORJSONResponse # type: ignore

app = FastAPI(default_response_class=ORJSONResponse)

app.include_router(testcase_router)
