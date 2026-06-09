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

@app.route("/pet")
def pet_page():
    return send_from_directory("static", "pet.html")

@app.route("/qq")
def qq_page():
    return send_from_directory("static", "qq.html")

@app.route("/device")
def device_page():
    return send_from_directory("static", "device.html")

@app.route("/reader")
def reader_page():
    return send_from_directory("static", "reader.html")

@app.route("/cinema")
def cinema_page():
    return send_from_directory("static", "cinema.html")

@app.route("/persona")
def persona_page():
    return send_from_directory("static", "persona.html")

@app.route("/settings")
def settings_page():
    return send_from_directory("static", "settings.html")

@app.route("/apiconfig")
def apiconfig_page():
    return send_from_directory("static", "apiconfig.html")

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
        # 将request.args转为普通dict，避免编码问题
        params = {k: v for k, v in request.args.items()}
        resp = http_requests.request(
            method=request.method, url=target, headers=headers,
            json=request.get_json(silent=True), params=params, timeout=30,
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
@app.route("/mcp", methods=["GET", "POST"])
def mcp_proxy():
    target = f"{GATEWAY_URL}/mcp"
    headers = {k: v for k, v in request.headers if k.lower() not in ("host", "content-length")}
    if request.method == "GET":
        # SSE 流式代理
        try:
            resp = http_requests.get(target, headers=headers, stream=True, timeout=300)
            excluded = {"content-encoding", "transfer-encoding", "content-length", "connection"}
            resp_headers = {k: v for k, v in resp.headers.items() if k.lower() not in excluded}
            resp_headers["Cache-Control"] = "no-cache"
            resp_headers["X-Accel-Buffering"] = "no"

            def generate():
                for chunk in resp.iter_content(chunk_size=None):
                    if chunk:
                        yield chunk

            return Response(stream_with_context(generate()), status=resp.status_code,
                          headers=resp_headers, content_type="text/event-stream")
        except http_requests.RequestException as e:
            return jsonify({"error": str(e)}), 502
    else:
        try:
            resp = http_requests.post(target, json=request.get_json(silent=True), headers=headers, timeout=30)
            return Response(resp.content, status=resp.status_code, content_type="application/json")
        except http_requests.RequestException as e:
            return jsonify({"error": str(e)}), 502

# ── 旧版 HTTP+SSE MCP 代理（2024-11-05 协议兼容） ──
@app.route("/sse", methods=["GET"])
def sse_proxy():
    target = f"{GATEWAY_URL}/sse"
    headers = {k: v for k, v in request.headers if k.lower() not in ("host", "content-length")}
    try:
        resp = http_requests.get(target, headers=headers, stream=True, timeout=300)
        excluded = {"content-encoding", "transfer-encoding", "content-length", "connection"}
        resp_headers = {k: v for k, v in resp.headers.items() if k.lower() not in excluded}
        resp_headers["Cache-Control"] = "no-cache"
        resp_headers["X-Accel-Buffering"] = "no"

        def generate():
            for chunk in resp.iter_content(chunk_size=None):
                if chunk:
                    yield chunk

        return Response(stream_with_context(generate()), status=resp.status_code,
                      headers=resp_headers, content_type="text/event-stream")
    except http_requests.RequestException as e:
        return jsonify({"error": str(e)}), 502

@app.route("/messages", methods=["POST"])
def messages_proxy():
    target = f"{GATEWAY_URL}/messages"
    headers = {k: v for k, v in request.headers if k.lower() not in ("host", "content-length")}
    try:
        resp = http_requests.post(target, json=request.get_json(silent=True), headers=headers, timeout=30)
        return Response(resp.content, status=resp.status_code, content_type="application/json")
    except http_requests.RequestException as e:
        return jsonify({"error": str(e)}), 502

# ── 用户数据同步 API ──
_SYNC_DATA_FILE = os.path.join(os.path.dirname(__file__), "sync_data.json")

def _load_sync_data():
    if not os.path.exists(_SYNC_DATA_FILE):
        return {}
    try:
        with open(_SYNC_DATA_FILE) as f:
            return _pet_json.load(f)
    except Exception:
        return {}

def _save_sync_data(data):
    with open(_SYNC_DATA_FILE, "w") as f:
        _pet_json.dump(data, f, indent=2, ensure_ascii=False)

@app.route("/api/sync", methods=["GET"])
def get_sync():
    """获取所有同步数据"""
    data = _load_sync_data()
    return jsonify({"status": "ok", "data": data})

@app.route("/api/sync", methods=["POST"])
def post_sync():
    """推送本地数据到云端，合并策略：按key的timestamp取最新"""
    incoming = request.get_json(silent=True) or {}
    if "data" not in incoming:
        return jsonify({"error": "缺少data字段"}), 400
    cloud = _load_sync_data()
    for key, entry in incoming["data"].items():
        if not isinstance(entry, dict) or "ts" not in entry:
            continue
        if key not in cloud or entry["ts"] > cloud[key].get("ts", 0):
            cloud[key] = entry
    _save_sync_data(cloud)
    return jsonify({"status": "ok", "data": cloud})

@app.route("/api/sync/<key>", methods=["DELETE"])
def delete_sync_key(key):
    """删除某个同步key"""
    data = _load_sync_data()
    if key in data:
        del data[key]
        _save_sync_data(data)
    return jsonify({"status": "ok"})

# ── 健康检查 ──
@app.route("/health")
def health():
    return jsonify({"status": "ok", "service": "cangyv-frontend"})

# ── 宠物状态 API（苍瞳 & 玄镜） ──
import json as _pet_json
from datetime import datetime as _dt, timezone as _tz

@app.route("/api/pet", methods=["GET"])
def get_all_pets():
    data = _load_pet_data()
    now = _dt.now(_tz.utc)
    for pid, pet in data.items():
        _apply_decay(pet, now)
    _save_pet_data(data)
    return jsonify({"status": "ok", "pets": data})

@app.route("/api/pet/<pid>", methods=["GET"])
def get_pet(pid):
    data = _load_pet_data()
    if pid not in data:
        return jsonify({"error": "未知宠物"}), 404
    now = _dt.now(_tz.utc)
    _apply_decay(data[pid], now)
    _save_pet_data(data)
    return jsonify({"status": "ok", "pet": data[pid]})

@app.route("/api/pet/<pid>/feed", methods=["POST"])
def feed_pet(pid):
    data = _load_pet_data()
    if pid not in data:
        return jsonify({"error": "未知宠物"}), 404
    now = _dt.now(_tz.utc)
    _apply_decay(data[pid], now)
    data[pid]["hunger"] = min(100, data[pid]["hunger"] + 25)
    data[pid]["state"] = "eat"
    data[pid]["last_update"] = now.isoformat()
    _save_pet_data(data)
    return jsonify({"status": "ok", "pet": data[pid], "action": "feed"})

@app.route("/api/pet/<pid>/play", methods=["POST"])
def play_pet(pid):
    data = _load_pet_data()
    if pid not in data:
        return jsonify({"error": "未知宠物"}), 404
    now = _dt.now(_tz.utc)
    _apply_decay(data[pid], now)
    data[pid]["mood"] = min(100, data[pid]["mood"] + 15)
    data[pid]["energy"] = max(0, data[pid]["energy"] - 15)
    data[pid]["state"] = "happy"
    data[pid]["last_update"] = now.isoformat()
    _save_pet_data(data)
    return jsonify({"status": "ok", "pet": data[pid], "action": "play"})

@app.route("/api/pet/<pid>/bathe", methods=["POST"])
def bathe_pet(pid):
    data = _load_pet_data()
    if pid not in data:
        return jsonify({"error": "未知宠物"}), 404
    now = _dt.now(_tz.utc)
    _apply_decay(data[pid], now)
    data[pid]["mood"] = min(100, data[pid]["mood"] + 10)
    data[pid]["state"] = "happy"
    data[pid]["last_update"] = now.isoformat()
    _save_pet_data(data)
    return jsonify({"status": "ok", "pet": data[pid], "action": "bathe"})

@app.route("/api/pet/<pid>/sleep", methods=["POST"])
def sleep_pet(pid):
    data = _load_pet_data()
    if pid not in data:
        return jsonify({"error": "未知宠物"}), 404
    now = _dt.now(_tz.utc)
    _apply_decay(data[pid], now)
    data[pid]["energy"] = min(100, data[pid]["energy"] + 30)
    data[pid]["state"] = "sleep"
    data[pid]["last_update"] = now.isoformat()
    _save_pet_data(data)
    return jsonify({"status": "ok", "pet": data[pid], "action": "sleep"})

@app.route("/api/pet/ai-care", methods=["POST"])
def ai_care():
    data = _load_pet_data()
    now = _dt.now(_tz.utc)
    results = []
    for pid, pet in data.items():
        if pet.get("caretaker") != "ai":
            continue
        _apply_decay(pet, now)
        actions = []
        if pet["hunger"] < 50:
            pet["hunger"] = min(100, pet["hunger"] + 25)
            pet["state"] = "eat"
            actions.append("feed")
        if pet["mood"] < 40:
            pet["mood"] = min(100, pet["mood"] + 15)
            pet["energy"] = max(0, pet["energy"] - 10)
            actions.append("play")
        if pet["energy"] < 30:
            pet["energy"] = min(100, pet["energy"] + 30)
            pet["state"] = "sleep"
            actions.append("sleep")
        pet["last_update"] = now.isoformat()
        results.append({"pet": pid, "actions": actions if actions else ["healthy"],
                        "status": {"hunger": pet["hunger"], "mood": pet["mood"], "energy": pet["energy"]}})
    _save_pet_data(data)
    return jsonify({"success": True, "results": results})

_PET_DATA_FILE = os.path.join(os.path.dirname(__file__), "pet_data.json")

def _load_pet_data():
    if not os.path.exists(_PET_DATA_FILE):
        return _default_pet_data()
    try:
        with open(_PET_DATA_FILE) as f:
            return _pet_json.load(f)
    except Exception:
        return _default_pet_data()

def _save_pet_data(data):
    with open(_PET_DATA_FILE, "w") as f:
        _pet_json.dump(data, f, indent=2, ensure_ascii=False)

def _default_pet_data():
    now = _dt.now(_tz.utc).isoformat()
    return {
        "cangtong": {"caretaker": "ai", "hunger": 80, "mood": 80, "energy": 80, "state": "idle", "last_update": now},
        "xuanjing": {"caretaker": "user", "hunger": 80, "mood": 80, "energy": 80, "state": "idle", "last_update": now}
    }

def _apply_decay(pet, now):
    try:
        last = _dt.fromisoformat(pet["last_update"])
    except Exception:
        last = now
    diff = (now - last).total_seconds() / 60.0
    if diff < 1:
        return
    factor = diff / 30.0
    pet["hunger"] = max(0, pet["hunger"] - int(factor * 3))
    pet["mood"] = max(0, pet["mood"] - int(factor * 2))
    pet["energy"] = max(0, pet["energy"] - int(factor * 1))
    pet["last_update"] = now.isoformat()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=DEBUG)

