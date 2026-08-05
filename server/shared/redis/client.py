import os
import redis
from dotenv import load_dotenv
from shared.logger import logger

load_dotenv()

redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST"),
    port=os.getenv("REDIS_PORT"),
    username=os.getenv("REDIS_USER"),
    password=os.getenv("REDIS_PASSWORD"),
    decode_responses=True
)

def get_redis():
    return redis_client

def check_connection():
    try:
        redis_client.ping()
        logger.info("Connected to Redis successfully.")
    except redis.ConnectionError as e:
        logger.error(f"Failed to connect to Redis: {e}")
        raise e