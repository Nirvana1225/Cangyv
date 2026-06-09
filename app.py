"""Cangyv — 前端静态服务 + API代理"""
from flask import Flask, send_from_directory, request, jsonify, Response, stream_with_context
import requests as http_requests
import os
from config import GATEWAY_URL, DEFAULT_API_KEY, PORT, DEBUG

app = Flask(__name__, static_folder="static", static_url_path="")

# ── 静态页面路由 ──
@app.route("/")
def index():
    return send_from_directory("static", "index.html")

@app.route("/chat")
def chat_page():
    return send_from_directory("static", "chat.html")

@app.route("/diary")
def diary_page():
    return send_from_directory("static", "diary.html")

@app.route("/ecg")
def ecg_page():
    return send_from_directory("static", "ecg.html")

@app.route("/panel")
def panel_page():
    return send_from_directory("static", "panel.html")

@app.route("/qq")
def qq_page():
    return send_from_directory("static", "qq.html")

@app.route("/device")
def device_page():
    return send_from_directory("static", "device.html")

@app.route("/reader")
def reader_page():
    return send_from_directory("static", "reader.html")

# ── Public 资源 ──
@app.route("/public/<path:filename>")
def public_files(filename):
    return send_from_directory("public", filename)

# ── API 代理 → 网关后端 ──
@app.route("/api/<path:path>", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
def api_proxy(path):
    target = f"{GATEWAY_URL}/api/{path}"
    headers = {k: v for k, v in request.headers if k.lower() not in ("host", "content-length")}
    if "X-Api-Key" not in headers and "x-api-key" not in headers:
        headers["X-API-Key"] = DEFAULT_API_KEY
    try:
        resp = http_requests.request(
            method=request.method, url=target, headers=headers,
            json=request.get_json(silent=True), params=request.args, timeout=30,
        )
        excluded = {"content-encoding", "transfer-encoding", "content-length", "connection"}
        resp_headers = {k: v for k, v in resp.headers.items() if k.lower() not in excluded}
        return Response(resp.content, status=resp.status_code, headers=resp_headers)
    except http_requests.RequestException as e:
        return jsonify({"error": str(e)}), 502

# ── 模型路由代理（支持SSE流式） ──
@app.route("/v1/<path:path>", methods=["GET", "POST", "OPTIONS"])
def v1_proxy(path):
    target = f"{GATEWAY_URL}/v1/{path}"
    headers = {k: v for k, v in request.headers if k.lower() not in ("host", "content-length")}
    if "X-Api-Key" not in headers and "x-api-key" not in headers:
        headers["X-API-Key"] = DEFAULT_API_KEY
    body = request.get_json(silent=True)
    is_stream = body and body.get("stream", False)

    try:
        if is_stream:
            # SSE 流式代理
            resp = http_requests.post(target, json=body, headers=headers, stream=True, timeout=120)
            excluded = {"content-encoding", "transfer-encoding", "content-length", "connection"}
            resp_headers = {k: v for k, v in resp.headers.items() if k.lower() not in excluded}
            resp_headers["Cache-Control"] = "no-cache"
            resp_headers["X-Accel-Buffering"] = "no"

            def generate():
                for chunk in resp.iter_content(chunk_size=None):
                    if chunk:
                        yield chunk

            return Response(stream_with_context(generate()), status=resp.status_code,
                          headers=resp_headers, content_type=resp.headers.get("Content-Type", "text/event-stream"))
        else:
            resp = http_requests.request(
                method=request.method, url=target, headers=headers,
                json=body, params=request.args, timeout=60,
            )
            excluded = {"content-encoding", "transfer-encoding", "content-length", "connection"}
            resp_headers = {k: v for k, v in resp.headers.items() if k.lower() not in excluded}
            return Response(resp.content, status=resp.status_code, headers=resp_headers)
    except http_requests.RequestException as e:
        return jsonify({"error": str(e)}), 502

# ── MCP 代理 ──
@app.route("/mcp", methods=["POST"])
def mcp_proxy():
    target = f"{GATEWAY_URL}/mcp"
    headers = {k: v for k, v in request.headers if k.lower() not in ("host", "content-length")}
    try:
        resp = http_requests.post(target, json=request.get_json(silent=True), headers=headers, timeout=30)
        return Response(resp.content, status=resp.status_code, content_type="application/json")
    except http_requests.RequestException as e:
        return jsonify({"error": str(e)}), 502

# ── 健康检查 ──
@app.route("/health")
def health():
    return jsonify({"status": "ok", "service": "cangyv-frontend"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=DEBUG)
