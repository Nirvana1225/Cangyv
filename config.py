"""Cangyv 前端配置"""
import os

GATEWAY_URL = os.environ.get("GATEWAY_URL", "https://mr-blinds-hose.zeabur.app")
DEFAULT_API_KEY = os.environ.get("API_KEY", "3wT6QvRmPUuVDmzdSatIbscavsh5gfaU")
PORT = int(os.environ.get("PORT", 5050))
DEBUG = os.environ.get("DEBUG", "false").lower() == "true"
