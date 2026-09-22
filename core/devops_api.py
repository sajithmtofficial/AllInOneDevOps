import os
import sys
import json
import re
import subprocess
import tempfile

import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST


# ============================================================
# SETTINGS
# ============================================================

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "qwen2.5:3b"

# Process used by the Run/Stop buttons
running_process = None


# ============================================================
# 1. RUN PYTHON CODE
# ============================================================

@csrf_exempt
@require_POST
def run_code(request):
    global running_process

    try:
        data = json.loads(request.body.decode("utf-8"))
        code = data.get("code", "")
        language = data.get("language", "python")

        if not code.strip():
            return JsonResponse({
                "success": False,
                "output": "No code was provided."
            }, status=400)

        if language.lower() != "python":
            return JsonResponse({
                "success": False,
                "output": (
                    f"Execution for {language} is not configured yet.\n\n"
                    "Currently, Python execution is supported."
                )
            })

        if running_process is not None:
            try:
                if running_process.poll() is None:
                    running_process.kill()
            except Exception:
                pass
            running_process = None

        temp_file = tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".py",
            delete=False,
            encoding="utf-8"
        )
        temp_file.write(code)
        temp_file.close()

        try:
            process = subprocess.Popen(
                [sys.executable, "-u", temp_file.name],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding="utf-8",
                errors="replace"
            )

            running_process = process

            try:
                stdout, stderr = process.communicate(timeout=10)

                output = ""
                if stdout:
                    output += stdout
                if stderr:
                    output += stderr

                if not output.strip():
                    output = "Program finished successfully with no output."

                return JsonResponse({
                    "success": process.returncode == 0,
                    "output": output,
                    "returncode": process.returncode
                })

            except subprocess.TimeoutExpired:
                process.kill()
                stdout, stderr = process.communicate()

                output = ""
                if stdout:
                    output += stdout
                if stderr:
                    output += stderr

                output += (
                    "\n\nProcess stopped after 10 seconds "
                    "to prevent an infinite-running program."
                )

                return JsonResponse({
                    "success": False,
                    "output": output,
                    "timeout": True
                })

        finally:
            try:
                os.unlink(temp_file.name)
            except Exception:
                pass
            running_process = None

    except Exception as e:
        return JsonResponse({
            "success": False,
            "output": f"Execution error: {str(e)}"
        }, status=500)


# ============================================================
# 2. STOP RUNNING CODE
# ============================================================

@csrf_exempt
@require_POST
def stop_code(request):
    global running_process

    try:
        if running_process is not None:
            if running_process.poll() is None:
                running_process.kill()
            running_process = None
            return JsonResponse({
                "success": True,
                "message": "Process stopped."
            })

        return JsonResponse({
            "success": True,
            "message": "No running process."
        })

    except Exception as e:
        return JsonResponse({
            "success": False,
            "message": str(e)
        })


# ============================================================
# 3. EXTRACT CODE FROM AI RESPONSE
# ============================================================

def extract_code(text):
    """Extract the first fenced code block from an Ollama response."""
    if not text:
        return ""

    match = re.search(r"```(?:python|py|javascript|js|text)?\s*\n?(.*?)```", text, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()

    # If the model followed the instruction and returned only code,
    # use the whole response. Avoid treating normal prose as code.
    lines = text.strip().splitlines()
    if lines and not any(
        phrase in text.lower()
        for phrase in ["here is", "the corrected", "i fixed", "explanation:"]
    ):
        return text.strip()

    return ""


# ============================================================
# 4. BUILD A SMALL, FAST PROMPT
# ============================================================

def build_prompt(message, code, action):
    if action == "fix":
        return f"""You are a fast Python debugger.
Find syntax, runtime, and obvious logic errors in the code.
Return ONLY the complete corrected Python code inside exactly one ```python``` block.
Do not explain. Do not add commentary before or after the code block.

User request:
{message}

Code:
```python
{code}
```"""

    if action == "generate":
        return f"""You are a fast Python coding assistant.
Generate clean working Python code for the request.
Return the code first inside one ```python``` block, then one short sentence.

Request:
{message}

Current code if relevant:
```python
{code}
```"""

    if action == "refactor":
        return f"""You are a fast Python code refactoring assistant.
Improve the supplied code while preserving its behavior.
Return the improved code inside one ```python``` block and keep the explanation to one short sentence.

Request:
{message}

Code:
```python
{code}
```"""

    if action == "explain":
        return f"""Explain this Python code simply and briefly.
Mention the main purpose, important variables/functions, and any obvious error.
Keep the answer under 180 words.

Request:
{message}

Code:
```python
{code}
```"""

    return f"""You are the coding assistant inside an All-in-One DevOps Platform.
Answer the user's programming question clearly and briefly.
Prefer practical Python/Django/React/Git/Docker/DevOps guidance.
Keep the answer under 180 words.

Question:
{message}

Current code:
```text
{code}
```"""


# ============================================================
# 5. LOCAL OLLAMA AI ASSISTANT
# ============================================================

@csrf_exempt
@require_POST
def ai_assistant(request):
    try:
        data = json.loads(request.body.decode("utf-8"))

        message = data.get("message", "").strip()
        code = data.get("code", "")
        action = data.get("action", "chat")

        if not message and not code:
            return JsonResponse({
                "success": False,
                "reply": "Please enter a question or provide some code."
            }, status=400)

        prompt = build_prompt(message, code, action)

        # Smaller output = noticeably faster response for local AI.
        num_predict = 500 if action in ("fix", "generate", "refactor") else 300

        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "keep_alive": "10m",
                "options": {
                    "temperature": 0.1,
                    "num_predict": num_predict,
                },
            },
            timeout=90,
        )

        response.raise_for_status()
        result = response.json()
        reply = result.get("response", "").strip()

        if not reply:
            return JsonResponse({
                "success": False,
                "reply": "Ollama returned an empty response."
            }, status=502)

        corrected_code = ""
        if action in ("fix", "generate", "refactor"):
            corrected_code = extract_code(reply)

        # Fix mode is intentionally short because the actual code is
        # displayed separately in the React UI for easy copying.
        if action == "fix" and corrected_code:
            clean_reply = 'I found the error and generated the corrected code below. Click "📋 Paste to Editor" to insert it into the editor.'
        else:
            clean_reply = reply

        return JsonResponse({
            "success": True,
            "reply": clean_reply,
            "corrected_code": corrected_code,
            "source": "ollama",
            "model": OLLAMA_MODEL,
        })

    except requests.exceptions.ConnectionError:
        return JsonResponse({
            "success": False,
            "reply": (
                "Cannot connect to Ollama.\n\n"
                "Make sure Ollama is running and qwen2.5:3b is installed."
            )
        }, status=503)

    except requests.exceptions.Timeout:
        return JsonResponse({
            "success": False,
            "reply": "Ollama took too long to respond. Try a smaller piece of code."
        }, status=504)

    except requests.exceptions.RequestException as e:
        return JsonResponse({
            "success": False,
            "reply": f"Ollama request error: {str(e)}"
        }, status=502)

    except Exception as e:
        return JsonResponse({
            "success": False,
            "reply": f"AI request error: {str(e)}"
        }, status=500)


# ============================================================
# 6. OLLAMA HEALTH CHECK
# ============================================================

@csrf_exempt
@require_POST
def ai_health(request):
    try:
        response = requests.get(
            "http://localhost:11434/api/tags",
            timeout=5
        )
        response.raise_for_status()
        models = response.json().get("models", [])
        model_names = [m.get("name", "") for m in models]

        return JsonResponse({
            "success": True,
            "ollama": "online",
            "model": OLLAMA_MODEL,
            "model_installed": OLLAMA_MODEL in model_names
        })

    except Exception as e:
        return JsonResponse({
            "success": False,
            "ollama": "offline",
            "model": OLLAMA_MODEL,
            "error": str(e)
        }, status=503)
