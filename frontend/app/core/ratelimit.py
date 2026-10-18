"""Tiny in-memory rate limiter (per process). Good enough for a single-server
hospital site; use Redis if the backend is ever run on several servers."""
import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

_lock = threading.Lock()
_hits: dict[str, deque] = defaultdict(deque)


def _allow(key: str, limit: int, window: int) -> bool:
    now = time.monotonic()
    with _lock:
        if len(_hits) > 20000:  # keep memory bounded
            for k in [k for k, q in _hits.items() if not q or now - q[-1] > window]:
                _hits.pop(k, None)
        q = _hits[key]
        while q and now - q[0] > window:
            q.popleft()
        if len(q) >= limit:
            return False
        q.append(now)
        return True


def rate_limit(name: str, limit: int, window_seconds: int):
    """FastAPI dependency: max `limit` calls per `window_seconds` per client IP."""

    def dependency(request: Request) -> None:
        ip = request.client.host if request.client else "unknown"
        if not _allow(f"{name}:{ip}", limit, window_seconds):
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="TOO_MANY_REQUESTS")

    return dependency


# ---- brute-force protection for logins (per e-mail, since logins reach the API via the Next proxy) ----
def login_is_blocked(email: str, limit: int = 5, window: int = 900) -> bool:
    now = time.monotonic()
    with _lock:
        q = _hits[f"loginfail:{email}"]
        while q and now - q[0] > window:
            q.popleft()
        return len(q) >= limit


def login_register_failure(email: str) -> None:
    with _lock:
        _hits[f"loginfail:{email}"].append(time.monotonic())


def login_clear(email: str) -> None:
    with _lock:
        _hits.pop(f"loginfail:{email}", None)
