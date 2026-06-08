FROM python:3.12-slim

WORKDIR /app

# 系统依赖（opencv需要）
RUN apt-get update && apt-get install -y --no-install-recommends     build-essential     libgl1-mesa-glx     libglib2.0-0     libsm6     libxext6     libxrender-dev     && rm -rf /var/lib/apt/lists/*

# Python依赖
COPY aion-chat/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码
COPY aion-chat/ ./

EXPOSE 8080

# shell形式以展开$PORT环境变量
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
