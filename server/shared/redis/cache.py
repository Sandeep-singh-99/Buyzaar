import json
from typing import Any

from shared.redis.client import redis_client

def set_cache(key: str, value: Any, expire: int = 3600):
    redis_client.setex(
        key,
        expire,
        json.dumps(value, default=str)
    )


def get_cache(key: str):
    data = redis_client.get(key)

    if not data:
        return None

    return json.loads(data)


def delete_cache(key: str):
    redis_client.delete(key)


def exists(key: str):
    return redis_client.exists(key)


def clear_pattern(pattern: str):
    for key in redis_client.scan_iter(pattern):
        redis_client.delete(key)