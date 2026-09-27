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

def extract_code(text, language="plaintext"):
    """Extract code from an Ollama response for any supported language."""
    if not text:
        return ""

    # Prefer a fenced code block with any language label.
    match = re.search(r"```[^\n]*\n(.*?)```", text, re.DOTALL)
    if match:
        return match.group(1).strip()

    # Also support an opening fence followed by code on the same line.
    match = re.search(r"```[^\n]*\s*(.*?)```", text, re.DOTALL)
    if match:
        return match.group(1).strip()

    stripped = text.strip()
    if not stripped:
        return ""

    # If the model returned only code without fences, accept it unless
    # it clearly looks like explanatory prose.
    lower = stripped.lower()
    prose_markers = (
        "here is",
        "here's",
        "the corrected code",
        "the corrected",
        "i fixed",
        "i have fixed",
        "explanation:",
    )

    if not any(marker in lower for marker in prose_markers):
        return stripped

    return ""


# ============================================================
# 4. BUILD A SMALL, FAST PROMPT
# ============================================================

def build_prompt(message, code, language, action, terminal_output=""):
    """Build a language-aware prompt for the local Ollama model."""
    language = language or "plaintext"
    compiler_context = terminal_output or "No compiler/runtime output was provided."

    if action == "fix":
        return f"""You are an expert {language} programmer and debugger.

SELECTED LANGUAGE: {language}

Your task is to repair the COMPLETE program.

IMPORTANT RULES:
1. Keep the EXACT SAME programming language: {language}.
2. NEVER convert Java, C, or C++ code into Python.
3. Fix ALL errors you can identify, not just the first error.
4. Use the compiler/runtime output below as evidence for the actual error.
5. Return the COMPLETE corrected source file from the first line to the last line.
6. Do NOT return only the changed lines.
7. Do NOT replace a large program with a tiny example.
8. Do NOT omit functions, loops, classes, includes/imports, variables, or correct code.
9. Preserve the original program's purpose, structure, and behavior wherever possible.
10. Make the minimum necessary changes to correct the program.
11. Check variable scopes carefully, especially repeated loop variables.
12. Check brackets, semicolons, declarations, types, includes/imports, and syntax.
13. Before answering, mentally compile/check the entire corrected program.
14. Return ONLY ONE complete corrected code block.
15. Put the language name on the code fence, such as ```java, ```c, or ```cpp.
16. Do not put explanations inside the code block or after it.

USER REQUEST:
{message}

COMPILER/RUNTIME OUTPUT:
```text
{compiler_context}
```

CURRENT COMPLETE {language} SOURCE CODE:
```{language}
{code}
```

Now return the COMPLETE corrected {language} source code."""

    if action == "generate":
        return f"""You are an expert {language} programming assistant.

Selected programming language: {language}

Generate working {language} code.

Rules:
- Use ONLY {language}.
- Do not convert the solution to Python unless the selected language is Python.
- Return complete source code in one fenced code block.

Request:
{message}

Current code if relevant:
```{language}
{code}
```"""

    if action == "refactor":
        return f"""You are an expert {language} code refactoring assistant.

Selected programming language: {language}

Improve the COMPLETE program while preserving its behavior.

Rules:
- Keep the EXACT same language: {language}.
- Return the COMPLETE source code.
- Do not return only changed lines.
- Do not convert it to Python.
- Do not remove working sections of the program.
- Return the result in one fenced code block.

Request:
{message}

Code:
```{language}
{code}
```"""

    if action == "explain":
        return f"""You are an expert {language} programming assistant.

Explain this {language} code simply and briefly.
Mention the main purpose, important variables/functions, and obvious errors.

Request:
{message}

Code:
```{language}
{code}
```

Keep the answer under 180 words."""

    return f"""You are the coding assistant inside an All-in-One DevOps Platform.

Selected programming language: {language}

Answer the programming question clearly.
When modifying code, keep the same selected language.

Question:
{message}

Current {language} code:
```{language}
{code}
```

Keep the answer concise."""


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
        language = data.get("language", "python").strip().lower()
        terminal_output = data.get("terminal_output", "").strip()
        action = data.get("action", "chat")

        if not message and not code:
            return JsonResponse({
                "success": False,
                "reply": "Please enter a question or provide some code."
            }, status=400)

        prompt = build_prompt(message, code, language, action, terminal_output)

        # Large programs need enough output tokens to return the COMPLETE file.
        # The old 500-token limit caused large Java/C/C++ files to be truncated.
        if action in ("fix", "generate", "refactor"):
            num_predict = max(4096, min(12000, (len(code) // 2) + 1500))
        else:
            num_predict = 500

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
                    "num_ctx": 32768,
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
            corrected_code = extract_code(reply, language)

        # Fix mode is intentionally short because the actual code is
        # displayed separately in the React UI for easy copying.
        if action == "fix" and corrected_code:
            clean_reply = "I found the problem and generated the corrected code below."
        else:
            clean_reply = reply

        return JsonResponse({
            "success": True,
            "reply": clean_reply,
            "corrected_code": corrected_code,
            "source": "ollama",
            "model": OLLAMA_MODEL,
            "language": language,
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
