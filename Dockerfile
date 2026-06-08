FROM python:3.12-slim

WORKDIR /app

# 系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends     build-essential     libgl1-mesa-glx     libglib2.0-0     && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY aion-chat/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制整个项目
COPY aion-chat/ ./

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
