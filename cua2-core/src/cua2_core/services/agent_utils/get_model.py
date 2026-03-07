import os
from typing import Literal

from smolagents import InferenceClientModel, LiteLLMModel, Model

AppMode = Literal["original", "local"]

# Cloud models (require HF_TOKEN)
HF_MODELS = [
    "Qwen/Qwen3-VL-8B-Instruct",
    "Qwen/Qwen3-VL-30B-A3B-Instruct",
    "Qwen/Qwen3-VL-235B-A22B-Instruct",
]

# Local models (Ollama, no API keys) - optimized for 4GB VRAM (qwen3-vl:2b fastest)
OLLAMA_BASE = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
LOCAL_MODELS = [
    "ollama/qwen3-vl:2b",
    "ollama/llava",
    "ollama/llava:7b",
    "ollama/qwen3-vl:4b",
]


def get_app_mode() -> AppMode:
    """Return the configured runtime mode."""
    raw_mode = os.getenv("APP_MODE", "original").strip().lower()
    if raw_mode not in {"original", "local"}:
        raise ValueError(
            "Invalid APP_MODE. Expected 'original' or 'local'."
        )
    return raw_mode  # type: ignore[return-value]


def get_available_models() -> list[str]:
    """Return models based on mode (local vs cloud)."""
    if get_app_mode() == "local":
        return LOCAL_MODELS
    return HF_MODELS


# For routes compatibility. Keep in sync with the configured mode.
AVAILABLE_MODELS = get_available_models()


def get_model(model_id: str) -> Model:
    """Get the configured model backend for the active runtime mode."""
    if get_app_mode() == "local":
        return LiteLLMModel(
            model_id=model_id,
            api_base=OLLAMA_BASE,
            num_ctx=4096,  # Smaller context = faster inference
            # Local models in this project are multimodal, so keep structured
            # content arrays instead of flattening images into plain text.
            flatten_messages_as_text=False,
        )
    return InferenceClientModel(bill_to="smolagents", model_id=model_id)
