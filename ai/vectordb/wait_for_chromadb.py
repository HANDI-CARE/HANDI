import os
import sys
import time
from urllib import request


def wait_for_chromadb(max_wait_seconds: int = 240, interval_seconds: float = 2.0) -> None:
    host = os.getenv("CHROMADB_HOST", "chromadb")
    port = int(os.getenv("CHROMADB_PORT", "8000"))
    # Prefer v2 heartbeat if available, fallback to v1
    url_v2 = f"http://{host}:{port}/api/v2/heartbeat"
    url_v1 = f"http://{host}:{port}/api/v1/heartbeat"

    print(f"Waiting for ChromaDB at {url_v2} (fallback {url_v1}) ...", flush=True)
    start = time.time()
    attempts = 0
    while time.time() - start < max_wait_seconds:
        attempts += 1
        try:
            with request.urlopen(url_v2, timeout=2) as resp:
                if 200 <= resp.getcode() < 300:
                    print("ChromaDB is ready.", flush=True)
                    return
        except Exception:
            try:
                with request.urlopen(url_v1, timeout=2) as resp:
                    if 200 <= resp.getcode() < 300:
                        print("ChromaDB is ready (v1).", flush=True)
                        return
            except Exception:
                pass
        print(f"  still waiting... ({attempts})", flush=True)
        time.sleep(interval_seconds)

    print("ChromaDB was not ready in time.", flush=True)
    sys.exit(1)


if __name__ == "__main__":
    wait_for_chromadb()


