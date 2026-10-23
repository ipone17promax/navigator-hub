# -*- coding: utf-8 -*-
"""
NavigatorHub 自研 AI 本地推理服务
================================
作者：张柏慈    商用联系：15945033555（周六 / 周日在线）

作用：
    把本机已训练好的 Qwen2-0.5B-Instruct + QLoRA 适配器，通过最简 HTTP 接口
    暴露给导航站前端（默认 http://127.0.0.1:7860），不依赖任何云端大模型。

启动：
    python ai_server.py
    （首次加载模型需要几十秒，页面顶部状态点变绿即可对话）

可选环境变量：
    REYNA_BASE_MODEL   基座模型目录，默认 D:\\qwen2_05b_instruct
    REYNA_ADAPTER      LoRA 适配器目录，默认 D:\\张柏慈的模型训练\\8.19训练文件夹\\qwen_lora_out
    REYNA_PORT         服务端口，默认 7860
    REYNA_MAX_TOKENS   单次生成最大 token 数，默认 256

只监听 127.0.0.1，不对外网开放；前端页面通过跨域头访问本机。
"""

import json
import os
import sys
import threading
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

BASE_MODEL = os.environ.get("REYNA_BASE_MODEL", r"D:\qwen2_05b_instruct")
ADAPTER = os.environ.get("REYNA_ADAPTER", r"D:\张柏慈的模型训练\8.19训练文件夹\qwen_lora_out")
HOST = "127.0.0.1"
PORT = int(os.environ.get("REYNA_PORT", "7860"))
MAX_TOKENS = int(os.environ.get("REYNA_MAX_TOKENS", "256"))

# ---------- 全局推理状态 ----------
_state = {"ready": False, "loading": True, "error": "", "device": "", "adapter": False}
_tokenizer = None
_model = None
_gen_lock = threading.Lock()


def load_model() -> None:
    """后台线程加载模型，避免阻塞 HTTP 服务启动。"""
    global _tokenizer, _model
    try:
        import torch
        from transformers import AutoTokenizer, AutoModelForCausalLM

        device = "cuda" if torch.cuda.is_available() else "cpu"
        dtype = torch.float16 if device == "cuda" else torch.float32
        _state["device"] = device

        print(f"[AI] 加载基座模型：{BASE_MODEL}")
        _tokenizer = AutoTokenizer.from_pretrained(
            BASE_MODEL, trust_remote_code=True, local_files_only=True
        )
        if _tokenizer.pad_token is None:
            _tokenizer.pad_token = _tokenizer.eos_token

        _model = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL,
            torch_dtype=dtype,
            trust_remote_code=True,
            local_files_only=True,
        )
        _model.to(device)

        # LoRA 适配器存在则合并加载（与本人训练输出目录一致）
        if os.path.isdir(ADAPTER):
            try:
                from peft import PeftModel

                print(f"[AI] 加载 LoRA 适配器：{ADAPTER}")
                _model = PeftModel.from_pretrained(_model, ADAPTER)
                _state["adapter"] = True
            except Exception as exc:  # 适配器损坏时退回基座，保证服务可用
                print(f"[AI] 适配器加载失败，改用基座：{exc}")
        else:
            print(f"[AI] 未找到适配器目录，使用基座模型：{ADAPTER}")

        _model.eval()
        _state["ready"] = True
        print(f"[AI] 模型就绪（{device}），服务地址 http://{HOST}:{PORT}")
    except Exception as exc:
        _state["error"] = f"{exc}"
        print("[AI] 模型加载失败：", exc)
        traceback.print_exc()
    finally:
        _state["loading"] = False


def generate(messages: list) -> str:
    """按聊天模板生成回复；同一时刻只允许一个请求占用模型。"""
    import torch

    with _gen_lock:
        # 只保留最近 8 轮，防止 prompt 过长拖慢本地推理
        trimmed = messages[-8:]
        text = _tokenizer.apply_chat_template(
            trimmed, tokenize=False, add_generation_prompt=True
        )
        inputs = _tokenizer(text, return_tensors="pt").to(_state["device"])
        with torch.no_grad():
            outputs = _model.generate(
                **inputs,
                max_new_tokens=MAX_TOKENS,
                do_sample=True,
                temperature=0.7,
                top_p=0.9,
                repetition_penalty=1.08,
                pad_token_id=_tokenizer.eos_token_id,
            )
        reply = _tokenizer.decode(
            outputs[0][inputs["input_ids"].shape[-1]:], skip_special_tokens=True
        )
        return reply.strip() or "（模型没有生成有效内容）"


class Handler(BaseHTTPRequestHandler):
    # 本地开发页面端口不固定，放开跨域（服务只监听本机回环地址）
    def _cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

    def _json(self, code: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        if self.path.split("?")[0] == "/api/health":
            self._json(
                200,
                {
                    "ok": _state["ready"],
                    "loading": _state["loading"],
                    "error": _state["error"],
                    "device": _state["device"],
                    "adapter": _state["adapter"],
                    "model": os.path.basename(BASE_MODEL.rstrip("\\/")),
                },
            )
        else:
            self._json(404, {"error": "not found"})

    def do_POST(self) -> None:  # noqa: N802
        if self.path.split("?")[0] != "/api/chat":
            self._json(404, {"error": "not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length).decode("utf-8") if length else "{}"
            data = json.loads(raw)
            messages = data.get("messages") or []
            if not isinstance(messages, list) or not messages:
                self._json(400, {"error": "messages 不能为空"})
                return
            if not _state["ready"]:
                reason = "模型仍在加载" if _state["loading"] else (_state["error"] or "模型未就绪")
                self._json(503, {"error": reason})
                return
            self._json(200, {"reply": generate(messages)})
        except Exception as exc:
            traceback.print_exc()
            self._json(500, {"error": f"推理失败：{exc}"})

    def log_message(self, fmt: str, *args) -> None:
        # 精简日志，避免每次请求刷屏
        sys.stdout.write("[HTTP] %s\n" % (fmt % args))


def main() -> None:
    threading.Thread(target=load_model, daemon=True).start()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"[AI] 服务已启动：http://{HOST}:{PORT}（模型后台加载中）")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[AI] 已停止")
        server.shutdown()


if __name__ == "__main__":
    main()
