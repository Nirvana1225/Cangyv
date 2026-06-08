"""
Zeabur entry proxy — redirects to aion-chat/main.py
Fallback to simple app if import fails.
"""
import logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("entry")

try:
    import sys
    from pathlib import Path

    _chat_dir = Path(__file__).parent / "aion-chat"
    sys.path.insert(0, str(_chat_dir))

    from main import app
    log.info("Successfully loaded aion-chat app")
except Exception as e:
    log.error(f"Failed to load aion-chat app: {e}")
    # Fallback: minimal app so Zeabur doesn't crash
    from fastapi import FastAPI
    app = FastAPI(title="Cangyv (fallback)")
    
    @app.get("/")
    async def root():
        return {"status": "fallback", "error": str(e)}
    
    @app.get("/health")
    async def health():
        return {"status": "fallback", "error": str(e)}
    
    log.warning("Using fallback app — aion-chat failed to load")
