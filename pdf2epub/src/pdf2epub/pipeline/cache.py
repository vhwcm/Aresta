import hashlib
import json
from pathlib import Path
from typing import Optional, Dict, Any

class InferenceCache:
    def __init__(self, cache_dir: str | Path = ".layout_cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def compute_key(self, image_bytes: bytes, config: str = "v1") -> str:
        h = hashlib.sha256()
        h.update(image_bytes)
        h.update(config.encode("utf-8"))
        return h.hexdigest()

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        path = self.cache_dir / f"{key}.json"
        if path.exists():
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return None
        return None

    def set(self, key: str, data: Dict[str, Any]):
        path = self.cache_dir / f"{key}.json"
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception:
            pass
