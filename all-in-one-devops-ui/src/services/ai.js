import { api } from "./api";

export async function askAssistant({
  message = "",
  code = "",
  language = "python",
  action = "chat",
  terminalOutput = "",
}) {
  return api.post("/ai-assistant/", {
    message,
    code,
    language,
    action,
    terminal_output: terminalOutput,
  });
}
