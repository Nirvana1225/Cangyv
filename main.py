from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI(title="Cangyv")

@app.get("/")
async def root():
    return {"status": "ok", "message": "Cangyv is running"}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "cangyv"}
