import os
from dotenv import load_dotenv

load_dotenv()


JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')

ACCESS_TOKEN_EXPIRE_DAYS = 7

# Standard cache expiration times (in seconds)
CACHE_TTL_SHORT = 300   # 5 minutes for lists (search, category views)
CACHE_TTL_LONG = 3600   # 1 hour for specific product details
CACHE_TTL_CART = 1800  # 30 minutes for cart data