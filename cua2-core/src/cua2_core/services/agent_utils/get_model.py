import os

from smolagents import InferenceClientModel, LiteLLMModel, Model

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


def _use_local_mode() -> bool:
    """Use local Ollama when HF_TOKEN is not set."""
    return not os.getenv("HF_TOKEN")


def get_available_models() -> list[str]:
    """Return models based on mode (local vs cloud)."""
    if _use_local_mode():
        return LOCAL_MODELS
    return HF_MODELS


# For routes compatibility
AVAILABLE_MODELS = LOCAL_MODELS  # Default; routes call get_available_models()


def get_model(model_id: str) -> Model:
    """Get the model - LiteLLM/Ollama when local, InferenceClient when HF_TOKEN set."""
    if _use_local_mode():
        return LiteLLMModel(
            model_id=model_id,
            api_base=OLLAMA_BASE,
            num_ctx=4096,  # Smaller context = faster inference
        )
    return InferenceClientModel(bill_to="smolagents", model_id=model_id)
