from pydantic import BaseModel, HttpUrl
from typing import List, Optional

# --- Original Models ---

class ReportRequest(BaseModel):
    """
    This is what the frontend will send to us.
    Just a single piece of text.
    """
    text: str

class ClassificationResult(BaseModel):
    """
    The results from our fine-tuned classifier.
    """
    label: str    # Will be 'REAL' or 'FAKE'
    score: float  # The model's confidence (e.g., 0.95)

class SimilarClaim(BaseModel):
    """
    A single similar claim found in our vector database.
    """
    id: str
    text: str
    label: str    # 'REAL' or 'FAKE', 'UNKNOWN'
    distance: float # How similar it is (lower is better)

# --- New Models for Real-Time Check ---

class Source(BaseModel):
    """
    Represents a source URL found by the Gemini API grounding.
    """
    uri: Optional[HttpUrl] = None
    title: Optional[str] = None

class RealTimeCheck(BaseModel):
    """
    Holds the result from the Gemini API fact-check.
    """
    summary: str
    sources: List[Source] = []

# --- Updated Response Model ---

class ReportResponse(BaseModel):
    """
    This is the final, complete report we send back to the frontend.
    Includes classification, similar claims, and the real-time check.
    """
    classification: ClassificationResult
    similar_claims: Optional[List[SimilarClaim]] = None
    real_time_check: Optional[RealTimeCheck] = None # Added field

