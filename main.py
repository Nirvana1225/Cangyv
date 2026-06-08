"""
Cangyv — 入口代理
导入aion-chat/main.py的FastAPI app
"""

import sys
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cangyv")

# 把aion-chat加入路径
_chat_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "aion-chat")
if _chat_dir not in sys.path:
    sys.path.insert(0, _chat_dir)

try:
    from main import app
    logger.info("Cangyv: loaded aion-chat app")
except Exception as e:
    logger.warning("Cangyv: aion-chat import failed: %s", e)
    # Fallback: 简易app
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    app = FastAPI(title="Cangyv (fallback)")

    @app.get("/")
    async def root():
        return {"status": "degraded", "message": "aion-chat not loaded"}

    @app.get("/health")
    async def health():
        return {"status": "degraded", "service": "cangyv"}
