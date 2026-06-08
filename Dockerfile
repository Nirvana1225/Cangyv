FROM python:3.11-slim

# cache-bust: 1780923973
ARG CACHE_BUST

WORKDIR /app

# 安装系统依赖（opencv、语音等需要）
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    gcc \
    alsa-utils \
    libportaudio2 \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# 复制并安装依赖（用aion-chat的完整requirements）
COPY aion-chat/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制全部代码（注意排除大文件）
COPY . .

# 暴露端口
EXPOSE 8080

# 启动命令：入口改为cangyv_loader.py（避免与aion-chat/main.py循环导入）
CMD ["python", "-m", "uvicorn", "cangyv_loader:app", "--host", "0.0.0.0", "--port", "8080"]
