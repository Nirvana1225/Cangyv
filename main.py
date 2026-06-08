"""
Zeabur entry proxy — redirects to aion-chat/main.py
"""
import sys
from pathlib import Path

_chat_dir = Path(__file__).parent / "aion-chat"
sys.path.insert(0, str(_chat_dir))

from main import app
