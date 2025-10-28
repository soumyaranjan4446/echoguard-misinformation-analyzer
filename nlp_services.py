import os
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from sentence_transformers import SentenceTransformer
from scipy.special import softmax
from typing import Dict, List

# --- Configuration ---

# 1. Define paths
# This file is in backend/app/, so we go up two levels to get to backend/
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Path to your fine-tuned classifier model
CLASSIFIER_PATH = os.path.join(BASE_DIR, "models", "my-classifier-model")

# 2. Define model names
# This is the model we'll use for semantic similarity (embeddings).
# It's fast, small, and excellent for this task.
EMBEDDING_MODEL = 'all-MiniLM-L6-v2'

# 3. Define our labels (matches the training script)
# 0 = FAKE, 1 = REAL
LABELS = ["FAKE", "REAL"]

class NLPService:
    """
    This is a Singleton class that loads all required ML models
    into memory once and provides methods to access them.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            print("--- Initializing NLP Service ---")
            cls._instance = super(NLPService, cls).__new__(cls)
            
            # Detect device (use GPU if available, else CPU)
            cls.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            print(f"Using device: {cls.device}")

            # 1. Load the fine-tuned Classifier
            print(f"Loading classifier from: {CLASSIFIER_PATH}")
            cls.classifier_tokenizer = AutoTokenizer.from_pretrained(CLASSIFIER_PATH)
            cls.classifier_model = AutoModelForSequenceClassification.from_pretrained(CLASSIFIER_PATH)
            cls.classifier_model.to(cls.device)
            cls.classifier_model.eval() # Set to evaluation mode
            print("Classifier loaded successfully.")

            # 2. Load the Embedding Model (for similarity search)
            print(f"Loading embedding model: {EMBEDDING_MODEL}")
            # We specify the CPU for this model. This saves GPU memory for
            # the classifier, which needs it more. Embeddings are fast on CPU.
            cls.embedding_model = SentenceTransformer(EMBEDDING_MODEL, device='cpu')
            print("Embedding model loaded successfully.")
            print("--- NLP Service Ready ---")
            
        return cls._instance

    def classify_text(self, text: str) -> Dict[str, float]:
        """
        Runs the text through the fine-tuned classifier.
        Returns the label and confidence score.
        """
        # Tokenize the text
        inputs = self.classifier_tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=128
        ).to(self.device)

        # Get model predictions (logits)
        with torch.no_grad(): # Disable gradient calculation for inference
            outputs = self.classifier_model(**inputs)
            logits = outputs.logits
        
        # Convert logits to probabilities using softmax
        probabilities = softmax(logits.cpu().numpy()[0])
        
        # Get the winning class (0 or 1)
        predicted_class_id = int(probabilities.argmax())
        
        # Get the label name (FAKE or REAL)
        label = LABELS[predicted_class_id]
        
        # Get the confidence score
        score = float(probabilities[predicted_class_id])
        
        return {"label": label, "score": score}

    def get_embedding(self, text: str) -> List[float]:
        """
        Converts text into a numerical vector (embedding).
        """
        # The .encode() method takes text and returns a vector
        vector = self.embedding_model.encode(text, convert_to_numpy=True)
        return vector.tolist() # Convert to a standard Python list

# --- Global Singleton ---
# We create one (and only one) instance of the service here.
# Other files can now just 'from .nlp_services import nlp_service'
nlp_service = NLPService()