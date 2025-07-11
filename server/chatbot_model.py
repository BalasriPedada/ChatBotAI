import requests

def generate_reply(user_msg, history=[]):
    # Build a simple chat history prompt for LLaMA 3
    full_prompt = "You are a helpful and intelligent AI assistant. Answer clearly and concisely.\n"

    for msg in history[-5:]:  # Use last 5 messages for context
        role = "User" if msg["role"] == "user" else "Assistant"
        full_prompt += f"{role}: {msg['text']}\n"

    full_prompt += f"User: {user_msg}\nAssistant:"

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3",
                "prompt": full_prompt,
                "stream": False  # Use stream=True if you want to build a streaming bot
            }
        )
        result = response.json()
        return result.get("response", "I'm not sure how to answer that.")
    except Exception as e:
        print("❌ Ollama Error:", str(e))
        return "Error talking to the AI model."
