from fastapi import FastAPI
from . import settings

app = FastAPI(title="Yohan Backend")

@app.get("/health")
def health_check():
    return {"status": "ok"}
