import asyncio
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import time # For exponential backoff delay
from typing import Optional # <--- ADDED THIS IMPORT

# Import our Pydantic models (the "Menu")
from .pydantic_models import (
    ReportRequest,
    ReportResponse,
    ClassificationResult,
    RealTimeCheck,
    Source
)

# Import our services (the "Specialists")
from .nlp_services import nlp_service
from .vector_db import vector_db_service

# --- 1. Initialize the FastAPI App ---
app = FastAPI(
    title="EchoGuard API",
    description="API for misinformation analysis and propagation tracking.",
    version="1.0.0"
)

# --- 2. Configure CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 3. Gemini API Configuration ---
# Use an empty key first (for secure environment injection)
GEMINI_API_KEY = ""
MAX_RETRIES = 3 # Maximum number of retries for API call

async def get_realtime_fact_check(text: str) -> Optional[RealTimeCheck]:
    """
    Calls the Gemini API with search grounding to fact-check the text.
    Implements exponential backoff for retries.
    """
    system_prompt = (
        "You are a neutral fact-checker. Analyze the following statement based ONLY "
        "on information found via Google Search. Provide a concise, one-paragraph summary "
        "of whether the statement appears credible or contains potential misinformation, "
        "citing the key findings. Do not add your own opinions or analysis beyond summarizing "
        "the search results."
    )
    payload = {
        "contents": [{"parts": [{"text": text}]}],
        "tools": [{"google_search": {}}],
        "systemInstruction": {"parts": [{"text": system_prompt}]},
         "generationConfig": {
            "temperature": 0.1, # Low temperature for factual summary
            "maxOutputTokens": 200,
        }
    }

    headers = {'Content-Type': 'application/json'}
    current_retry = 0
    delay = 1.0 # Initial delay in seconds
    
    # Define a list of keys/URLs to try (starting with the environment default)
    # The empty key is first; if that fails with 403, we try the hardcoded one.
    keys_to_try = [
        "",  # Environment-injected key (preferred)
        "AIzaSyDJF4AYcWtoBb7Oqf0hNyEJb03ebo3Ezcc" # User-supplied key (fallback)
    ]
    
    for key in keys_to_try:
        current_retry = 0
        delay = 1.0
        # Reconstruct the URL with the current key
        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key={key}"
        
        # Log which key we are trying
        if key == "":
            print("--- Attempting real-time check using environment-injected key (default) ---")
        else:
            print("--- Attempting real-time check using hardcoded fallback key ---")

        while current_retry < MAX_RETRIES:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(api_url, json=payload, headers=headers)
                    response.raise_for_status()

                    result = response.json()
                    candidate = result.get('candidates', [{}])[0]

                    summary_text = candidate.get('content', {}).get('parts', [{}])[0].get('text', None)

                    if not summary_text:
                        print("Gemini API returned no summary text.")
                        return None 
                    
                    sources_data = []
                    grounding_metadata = candidate.get('groundingMetadata', {})
                    if grounding_metadata and 'groundingAttributions' in grounding_metadata:
                        for attr in grounding_metadata['groundingAttributions']:
                            web_data = attr.get('web')
                            if web_data and web_data.get('uri') and web_data.get('title'):
                                try:
                                    source_uri = web_data['uri']
                                    source_title = web_data['title']
                                    sources_data.append(Source(uri=source_uri, title=source_title))
                                except Exception as pydantic_err:
                                    print(f"Skipping invalid source URL: {web_data.get('uri')} - Error: {pydantic_err}")

                    print(f"Real-time check succeeded with key: {'Environment Key' if key == '' else 'Fallback Key'}")
                    return RealTimeCheck(summary=summary_text.strip(), sources=sources_data)

            except httpx.RequestError as e:
                current_retry += 1
                print(f"Gemini API request failed (Attempt {current_retry}/{MAX_RETRIES}): {e}")
                if current_retry >= MAX_RETRIES:
                    print(f"Max retries reached for key {'Environment Key' if key == '' else 'Fallback Key'}.")
                    break # Break inner loop, move to next key in outer loop
                print(f"Retrying in {delay:.1f} seconds...")
                await asyncio.sleep(delay)
                delay *= 2 
            except httpx.HTTPStatusError as e:
                print(f"Gemini API returned HTTP error {e.response.status_code}: {e.response.text}")
                # If 403, break the inner loop and try the next key
                if e.response.status_code == 403 and key == "":
                    print("403 received for environment key. Switching to fallback key.")
                    break 
                return None # For other HTTP errors, just fail and return None
            except Exception as e:
                print(f"Unexpected error during Gemini API call or processing: {e}")
                return None

    return None # Returns null only if both keys fail

# --- 4. Define a Welcome Endpoint ---
@app.get("/", tags=["General"])
def get_root():
    """Welcome endpoint."""
    return {"message": "Welcome to the EchoGuard API"}

# --- 5. Define the Core '/analyze' Endpoint (Now Async) ---
@app.post("/analyze", response_model=ReportResponse, tags=["Analysis"])
async def analyze_claim(request: ReportRequest): # Added 'async'
    """
    Analyzes a text claim for misinformation, finds similar claims,
    and performs a real-time web check.
    """
    try:
        # --- Run tasks concurrently ---
        # Start classification, DB query, and Gemini check at the same time
        classification_task = asyncio.to_thread(nlp_service.classify_text, request.text)
        db_query_task = asyncio.to_thread(vector_db_service.query_similar_claims, request.text, 3)
        real_time_check_task = get_realtime_fact_check(request.text)

        # Wait for all tasks to complete
        classification_dict, similar_claims_list, real_time_check_result = await asyncio.gather(
            classification_task,
            db_query_task,
            real_time_check_task,
            return_exceptions=True # Allow tasks to fail without stopping others
        )

        # --- Process results (check for exceptions) ---

        # Classification
        if isinstance(classification_dict, Exception):
            print(f"Error during classification: {classification_dict}")
            raise HTTPException(status_code=500, detail="Error during claim classification.")
        classification_result = ClassificationResult(
            label=classification_dict.get("label", "ERROR"),
            score=classification_dict.get("score", 0.0)
        )

        # DB Query
        if isinstance(similar_claims_list, Exception):
            print(f"Error during DB query: {similar_claims_list}")
            similar_claims_list = None # Continue without similar claims if DB fails

        # Real-Time Check
        if isinstance(real_time_check_result, Exception):
             print(f"Error during real-time check gather: {real_time_check_result}")
             real_time_check_result = None # Continue without real-time check if it fails

        # --- Add the *new* claim to the DB ---
        # Do this *after* processing results, so we don't block
        if classification_result.label != "ERROR":
            try:
                # Use create_task to run the background operation without awaiting
                asyncio.create_task(
                    asyncio.to_thread(vector_db_service.add_claim, request.text, classification_result.label)
                )
            except Exception as db_add_e:
                # Log error but don't crash the request
                print(f"Error scheduling add_claim to DB (non-blocking): {db_add_e}")


        # --- Build and return the final response ---
        return ReportResponse(
            classification=classification_result,
            similar_claims=similar_claims_list,
            real_time_check=real_time_check_result # Include the result (or None)
        )

    except HTTPException as http_exc:
        raise http_exc # Re-raise FastAPI specific errors
    except Exception as e:
        print(f"Unexpected error in /analyze endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail="An internal server error occurred."
        )
