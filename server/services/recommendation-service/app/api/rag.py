from fastapi import APIRouter, Depends, status, Request, HTTPException
import httpx
from sqlalchemy.orm import Session