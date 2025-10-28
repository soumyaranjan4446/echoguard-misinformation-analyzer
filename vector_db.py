import chromadb
from chromadb.utils import embedding_functions
import os
import uuid
from typing import List, Dict, Any

# --- Import our NLP Service ---
# This is the "brain" we just defined. We need it
# to create the embeddings (vectors) for our text.
from .nlp_services import nlp_service

# --- Configuration ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Define the path where ChromaDB will store its data
DB_PATH = os.path.join(BASE_DIR, "data", "chroma_db")

# This is the name of our "collection" (like a table in SQL)
COLLECTION_NAME = "misinformation_claims"

class VectorDBService:
    """
    A Singleton class to manage all interactions with ChromaDB.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            print("--- Initializing Vector DB Service ---")
            cls._instance = super(VectorDBService, cls).__new__(cls)
            
            # --- Custom Embedding Function ---
            # We tell ChromaDB to NOT use its own embedding model.
            # Instead, we create a function that calls *our* nlp_service.
            class CustomEmbeddingFunction(embedding_functions.EmbeddingFunction):
                def __call__(self, input_texts: List[str]) -> List[List[float]]:
                    # Use our nlp_service to get the embeddings
                    embeddings = []
                    for text in input_texts:
                        embeddings.append(nlp_service.get_embedding(text))
                    return embeddings

            # Set up the ChromaDB client
            # This creates a persistent database in the 'backend/data/chroma_db' folder
            cls.client = chromadb.PersistentClient(path=DB_PATH)
            
            # Get or create our collection, passing our custom embedding function
            cls.collection = cls.client.get_or_create_collection(
                name=COLLECTION_NAME,
                embedding_function=CustomEmbeddingFunction()
            )
            print(f"ChromaDB collection '{COLLECTION_NAME}' loaded/created.")
            print("--- Vector DB Service Ready ---")
            
        return cls._instance

    def add_claim(self, text: str, label: str) -> str:
        """
        Adds a new analyzed claim to the vector database.
        """
        # Generate a unique ID for this new entry
        claim_id = str(uuid.uuid4())
        
        # We store the text as the 'document' and the label as 'metadata'
        self.collection.add(
            documents=[text],
            metadatas=[{"label": label}],
            ids=[claim_id]
        )
        print(f"Added claim to DB. ID: {claim_id}")
        return claim_id

    def query_similar_claims(self, text: str, n_results: int = 3) -> List[Dict[str, Any]]:
        """
        Finds the 'n' most similar claims in the database to the given text.
        
        Note: The text itself is NOT added to the DB here. 
        We just use it for the query.
        """
        
        # Use the collection to query. ChromaDB will automatically
        # call our CustomEmbeddingFunction to turn the text into a vector
        # and then perform the similarity search.
        results = self.collection.query(
            query_texts=[text],
            n_results=n_results
        )
        
        # --- Process and format the results ---
        formatted_results = []
        
        # The results are nested, so we unpack them
        if not results['ids'][0]:
            return [] # Return empty list if no results
            
        ids = results['ids'][0]
        documents = results['documents'][0]
        metadatas = results['metadatas'][0]
        distances = results['distances'][0]

        for i in range(len(ids)):
            formatted_results.append({
                "id": ids[i],
                "text": documents[i],
                "label": metadatas[i].get('label', 'UNKNOWN'), # Get label from metadata
                "distance": distances[i]
            })
            
        return formatted_results

# --- Global Singleton ---
# Create one instance for the rest of the app to use
vector_db_service = VectorDBService()