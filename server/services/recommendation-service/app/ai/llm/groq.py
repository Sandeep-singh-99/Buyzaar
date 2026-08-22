import os

from langchain_groq import ChatGroq


def get_chat_model():
    return ChatGroq(
        model=os.getenv(
            "GROQ_MODEL",
            "llama-3.3-70b-versatile"
        ),
        temperature=0.2,
        api_key=os.getenv("GROQ_API_KEY"),
    )