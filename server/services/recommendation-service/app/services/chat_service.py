import re
import os
import sys
import logging
from typing import Dict, Any, List, Optional

# Ensure server root is in sys.path so 'shared' module can be imported cleanly
app_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
service_dir = os.path.dirname(app_dir)
services_dir = os.path.dirname(service_dir)
server_dir = os.path.dirname(services_dir)

for p in [server_dir, services_dir, service_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from sqlalchemy.orm import Session
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from app.services.rag_service import search_products
from app.core.config import GROQ_API_KEY, GROQ_MODEL

logger = logging.getLogger(__name__)

FALLBACK_MODELS = [
    GROQ_MODEL,
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
    "gemma2-9b-it",
]

NON_PRODUCT_PATTERNS = [
    r'\bpython\b', r'\bjava\b', r'\bjavascript\b', r'\bcode\b', r'\bprogramming\b', r'\bscript\b',
    r'\bcapital of\b', r'\bwho is\b', r'\bwho won\b', r'\bweather\b', r'\bclimate\b',
    r'\bpresident of\b', r'\bprime minister\b', r'\bpoem\b', r'\bessay\b', r'\bmath\b',
    r'\bsolve\b', r'\bequation\b', r'\bhistory\b', r'\bgeography\b'
]

SYSTEM_PROMPT_TEMPLATE = """You are Buyzaar's AI product recommendation assistant.

Answer the user's question using ONLY the product context provided below.

Rules:
- Never invent products, prices, or specifications.
- Recommend products ONLY from the retrieved context.
- STRICT PRICE RULE: If the user asked for products under or below a specific budget, you MUST ONLY mention products that are within that budget limit. Do NOT suggest any product that exceeds the user's budget.
- OUT OF CATALOG RULE: If the user's question is completely unrelated to products, shopping, or e-commerce, politely explain that you can only assist with product recommendations for Buyzaar's catalog.
- Be concise, helpful, and friendly.

PRODUCT CONTEXT:
{context}

USER QUESTION:
{question}"""


def is_non_product_query(query: str) -> bool:
    """Check if the query is a general knowledge question unrelated to shopping."""
    q_lower = query.lower()
    for pattern in NON_PRODUCT_PATTERNS:
        if re.search(pattern, q_lower):
            return True
    return False


def extract_max_price(query: str) -> Optional[float]:
    """Extract numeric budget or price limit from user query (e.g. 'under 10000', 'under 10k', 'below 50000')."""
    query_lower = query.lower()

    # Match 'under 10k' -> 10000
    match_k = re.search(r'(?:under|below|less than|within|max|budget)\s*(?:rs\.?|₹)?\s*(\d+(?:\.\d+)?)\s*k\b', query_lower)
    if match_k:
        try:
            return float(match_k.group(1)) * 1000.0
        except ValueError:
            pass

    # Match 'under 10000' or 'under 10,000'
    match_num = re.search(r'(?:under|below|less than|within|max|budget|<=?)\s*(?:rs\.?|₹)?\s*(\d[\d,]*)(?:\.\d+)?\b', query_lower)
    if match_num:
        try:
            num_str = match_num.group(1).replace(",", "")
            return float(num_str)
        except ValueError:
            pass

    return None


def get_chat_model(model_name: str) -> ChatGroq:
    """Initialize ChatGroq instance for a given model name."""
    return ChatGroq(
        model=model_name,
        temperature=0.2,
        api_key=GROQ_API_KEY
    )


async def generate_chat_recommendation(
    db: Session,
    message: str,
    top_k: int = 5
) -> Dict[str, Any]:
    """Execute RAG flow with out-of-scope warning detection, price filtering, and model fallback."""
    if is_non_product_query(message):
        logger.info(f"Query flagged as non-product / out of scope: '{message}'")
        return {
            "answer": "⚠️ Out of Catalog Scope: I am Buyzaar's AI Shopping Assistant. I can only assist with product recommendations, budget choices, and shopping advice for our store catalog. Please ask about products, mobile phones, laptops, or electronics!",
            "products": [],
            "is_out_of_scope": True
        }

    max_price = extract_max_price(message)
    search_k = 20 if max_price else top_k

    rag_results = search_products(db=db, query=message, top_k=search_k)

    # Perform strict price filtering if a budget constraint was specified
    if max_price is not None:
        logger.info(f"Detected budget constraint: max price = ₹{max_price}")
        filtered_results = []
        for item in rag_results:
            meta = item.get("metadata", {})
            s_price = meta.get("sales_price")
            p_price = meta.get("price")
            effective_price = s_price if s_price is not None else p_price
            if effective_price is not None:
                try:
                    if float(effective_price) <= max_price:
                        filtered_results.append(item)
                except (ValueError, TypeError):
                    filtered_results.append(item)
            else:
                filtered_results.append(item)

        rag_results = filtered_results[:top_k]

    if not rag_results:
        no_match_msg = (
            f"⚠️ Out of Catalog Scope: No products found under ₹{int(max_price):,} in our catalog. Try searching with a higher budget or different keywords!"
            if max_price
            else "⚠️ Out of Catalog Scope: No matching product was found in our catalog for your query. Try asking about mobiles, laptops, or accessories!"
        )
        return {
            "answer": no_match_msg,
            "products": [],
            "is_out_of_scope": True
        }

    context_snippets = []
    recommended_products = []

    for idx, item in enumerate(rag_results, 1):
        meta = item.get("metadata", {})
        context_snippets.append(f"Product #{idx}:\n{item.get('content', '')}")

        recommended_products.append({
            "product_id": meta.get("product_id", item.get("product_id")),
            "name": meta.get("name", "Unknown"),
            "brand": meta.get("brand"),
            "category": meta.get("category"),
            "price": meta.get("price"),
            "sales_price": meta.get("sales_price"),
            "image_url": meta.get("image_url")
        })

    context_str = "\n\n---\n\n".join(context_snippets)
    full_system_prompt = SYSTEM_PROMPT_TEMPLATE.format(context=context_str, question=message)

    messages = [
        SystemMessage(content=full_system_prompt),
        HumanMessage(content=message)
    ]

    answer_text = None
    last_error = None
    unique_models = list(dict.fromkeys(FALLBACK_MODELS))

    for model_candidate in unique_models:
        try:
            logger.info(f"Attempting LLM generation with Groq model: {model_candidate}")
            llm = get_chat_model(model_candidate)
            response = await llm.ainvoke(messages)
            answer_text = response.content
            break
        except Exception as e:
            logger.warning(f"Groq model '{model_candidate}' failed: {e}. Trying fallback model...")
            last_error = e

    if not answer_text:
        answer_text = f"Error generating recommendation: {str(last_error)}"

    return {
        "answer": answer_text,
        "products": recommended_products,
        "is_out_of_scope": False
    }
