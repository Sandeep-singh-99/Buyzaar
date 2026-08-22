import logging
from typing import Optional, Dict, Any, List
import httpx

from app.core.config import PRODUCT_SERVICE_URL, PRODUCT_SERVICE_INTERNAL_TOKEN

logger = logging.getLogger(__name__)


class ProductServiceError(Exception):
    """Base exception for Product Service HTTP communication errors."""
    pass


class ProductServiceClient:
    def __init__(self, base_url: str = PRODUCT_SERVICE_URL, token: str = PRODUCT_SERVICE_INTERNAL_TOKEN):
        self.base_url = base_url.rstrip("/")
        self.token = token

    def _get_headers(self, auth_header: Optional[str] = None) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if auth_header:
            headers["Authorization"] = auth_header
        elif self.token:
            headers["Authorization"] = f"Bearer {self.token}" if not self.token.startswith("Bearer ") else self.token
        return headers

    async def get_product(self, product_id: str, auth_header: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Fetch product details from Product Service by product_id."""
        urls = [
            f"{self.base_url}/api/products/get-product/{product_id}",
            f"{self.base_url}/get-product/{product_id}",
            f"{self.base_url}/api/products/find-product/{product_id}"
        ]
        headers = self._get_headers(auth_header)

        async with httpx.AsyncClient(timeout=15.0) as client:
            for url in urls:
                try:
                    response = await client.get(url, headers=headers)
                    if response.status_code == 200:
                        return response.json()
                    elif response.status_code == 404:
                        continue
                except httpx.HTTPError as e:
                    logger.warning(f"Error fetching product from {url}: {e}")
                    continue

        logger.error(f"Failed to find product {product_id} across Product Service endpoints")
        return None

    async def sync_all_products(self, auth_header: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch all products for RAG sync from Product Service."""
        urls = [
            f"{self.base_url}/api/products/rag/sync-all",
            f"{self.base_url}/rag/sync-all"
        ]
        headers = self._get_headers(auth_header)

        async with httpx.AsyncClient(timeout=40.0) as client:
            # Attempt admin sync-all endpoints first
            for url in urls:
                try:
                    response = await client.get(url, headers=headers)
                    if response.status_code == 200:
                        data = response.json()
                        products = data.get("products", [])
                        logger.info(f"Retrieved {len(products)} products from {url}")
                        return products
                    elif response.status_code in (401, 403):
                        logger.warning(f"Authentication failed for {url} ({response.status_code}). Attempting public product listing fallback...")
                        break
                except httpx.HTTPError as e:
                    logger.warning(f"Error calling sync-all endpoint {url}: {e}")

            # Fallback: Fetch all products via public /api/products/get-products pagination endpoint
            logger.info("Using public /api/products/get-products endpoint to sync all products...")
            all_products = []
            page = 1
            limit = 100

            while True:
                list_urls = [
                    f"{self.base_url}/api/products/get-products?page={page}&limit={limit}",
                    f"{self.base_url}/get-products?page={page}&limit={limit}"
                ]
                fetched_page = False

                for list_url in list_urls:
                    try:
                        resp = await client.get(list_url, headers=headers)
                        if resp.status_code == 200:
                            data = resp.json()
                            items = data.get("products", [])
                            if not items:
                                break
                            all_products.extend(items)
                            fetched_page = True
                            if len(items) < limit:
                                break
                            page += 1
                            break
                    except Exception as err:
                        logger.warning(f"Error fetching product list page {page} from {list_url}: {err}")

                if not fetched_page or (data and len(data.get("products", [])) < limit):
                    break

            if all_products:
                logger.info(f"Successfully fetched {len(all_products)} products via public listing fallback")
                return all_products

            raise ProductServiceError("Could not retrieve products from Product Service")


product_service_client = ProductServiceClient()
