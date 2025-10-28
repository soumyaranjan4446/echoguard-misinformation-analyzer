# EchoGuard - AI Misinformation Analyzer

EchoGuard is a full-stack application designed to analyze text claims for potential misinformation. It combines a fine-tuned NLP classification model, historical similarity search using a vector database, and real-time web verification via the Gemini API to provide a comprehensive assessment.


<img src="https://github.com/soumyaranjan4446/echoguard-misinformation-analyzer/blob/main/demoapp.gif"  />


## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Journey & Model Training](#project-journey--model-training)
- [Local Setup & Running](#local-setup--running)
- [How It Works (Demo)](#how-it-works-demo)
- [Future Enhancements](#future-enhancements)

---

## Features

* **AI-Powered Classification:** Utilizes a fine-tuned DistilBERT model to classify input text as potentially "REAL" or "FAKE" based on patterns learned from the `liar2` dataset.
* **Historical Similarity Search:** Employs a ChromaDB vector database and a sentence transformer (`all-MiniLM-L6-v2`) to find and display previously analyzed claims with similar semantic content.
* **Real-Time Web Verification:** Integrates with the Google AI Gemini API (using search grounding) to provide a live fact-check summary based on current web results.
* **High-Contrast UI:** Minimalist, dark-themed interface built with Next.js and Tailwind CSS for clear readability.

---

## Architecture Overview

EchoGuard uses a decoupled microservices-style architecture:

1.  **Frontend (Next.js):** A React-based interface allowing users to submit text and view the analysis report. Communicates with the backend via REST API calls.
2.  **Backend (FastAPI):** A Python API server responsible for:
    * Loading and running the fine-tuned classification model.
    * Generating text embeddings for vector search.
    * Interacting with the ChromaDB vector database (storing and querying).
    * Calling the external Gemini API for real-time fact-checking.
3.  **Vector Database (ChromaDB):** Persistently stores embeddings and metadata of analyzed claims for similarity search.

For a deeper dive into the technical design, see the [ARCHITECTURE.md](ARCHITECTURE.md) file.

---

## Tech Stack

* **Frontend:** Next.js, React, TypeScript, Tailwind CSS, Lucide Icons
* **Backend:** Python, FastAPI, Uvicorn
* **ML / NLP:** PyTorch, Transformers (Hugging Face), Sentence Transformers, Scikit-learn
* **Vector DB:** ChromaDB
* **External APIs:** Google AI Gemini API (with Search Grounding)
* **Environment:** Python Virtual Environment (for local backend), Node.js (for local frontend)

---

## Project Journey & Model Training

This project underwent significant iteration, particularly during the model training phase, highlighting common challenges in applied ML:

1.  **Initial Model & Dataset:** Started with `microsoft/deberta-v3-xsmall` on the original `liar` dataset.
2.  **Dataset Upgrade Attempt 1:** Switched to a Kaggle dataset (`Gen AI Misinformation Detection Data (2024–2025)`) promising recent data.
    * **Problem:** Debugging revealed this dataset contained only placeholder text ("Sample post content..."), rendering it unusable. Models failed to train, consistently guessing the majority class.
    * **Learnings:** The importance of data validation and sanity checking. Even seemingly legitimate datasets can be flawed.
3.  **Dataset Upgrade Attempt 2:** Pivoted to established Hugging Face datasets (`liar_plus`, `Cadenza-Labs/liars-bench`).
    * **Problem:** Encountered issues with Hugging Face Hub authentication (gated datasets) and potential dataset unavailability/changes.
4.  **Final Successful Training:** Settled on the robust, ungated `chengxuphd/liar2` dataset from Hugging Face.
    * **Model:** Used `distilbert-base-uncased` for a balance of speed and accuracy.
    * **Preprocessing:** Simplified the 6 original labels ('pants-fire', 'false', 'barely-true', 'half-true', 'mostly-true', 'true') into a binary classification problem: FAKE (0) and REAL (1).
    * **Training:** Fine-tuned the model for 3 epochs using the `transformers` library Trainer API in a Google Colab notebook (to leverage free GPU resources).
    * **Result:** Achieved strong performance (F1 Score ~0.81), demonstrating successful learning.

![Model Training GIF](assets/model_training.gif)
*(Placeholder: Replace this line with the actual path if your GIF is named differently)*

---

## Local Setup & Running

Follow these steps to run the complete EchoGuard application locally.

**Prerequisites:**

* Python 3.10+
* Node.js 18+ and npm
* Git

**Setup:**

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/your-username/echoguard-project.git](https://github.com/your-username/echoguard-project.git)
    cd echoguard-project
    ```

2.  **Set up Backend:**
    * Navigate to the backend directory: `cd backend`
    * Create and activate a virtual environment:
        ```bash
        python -m venv venv
        # On Windows: .\venv\Scripts\activate
        # On macOS/Linux: source venv/bin/activate
        ```
    * Install backend dependencies: `pip install -r requirements.txt`
    * **(Crucial)** Place your trained model files (`config.json`, `model.safetensors`, etc.) inside `backend/models/my-classifier-model/`.

3.  **Set up Frontend:**
    * Navigate to the frontend directory: `cd ../frontend`
    * Install frontend dependencies: `npm install`

**Running the Application:**

You need two separate terminals.

1.  **Terminal 1: Start Backend**
    * Navigate to `echoguard-project/backend`.
    * Activate the virtual environment (`source venv/bin/activate` or `.\venv\Scripts\activate`).
    * Start the server using the provided script (handles imports correctly):
        ```bash
       python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
        ```
    * Wait for the message indicating models are loaded and the server is running on `http://localhost:8000`.

2.  **Terminal 2: Start Frontend**
    * Navigate to `echoguard-project/frontend`.
    * Start the Next.js development server:
        ```bash
        npm run dev
        ```
    * Wait for the server to be ready on `http://localhost:3000`.

3.  **Access:** Open your web browser and go to **`http://localhost:3000`**.

---

## How It Works (Demo)

*(Placeholder: Add a brief description here walking through the steps shown in your `app_demo.gif`)*

1.  User pastes text into the input area.
2.  User clicks "Analyze Claim".
3.  Loading indicators appear while the backend processes.
4.  The report displays:
    * Internal classification result (FAKE/REAL score).
    * Real-time web verification summary and sources (if available).
    * Historically similar claims from the vector database.

---

## Future Enhancements

* **User Authentication:** Add user accounts to track analysis history.
* **Browser Extension:** Create an extension for easier analysis of web content.
* **Advanced Visualization:** Visualize claim propagation networks.
* **More Sophisticated Real-Time Check:** Integrate multiple fact-checking APIs.
* **Docker Deployment Fix:** Resolve local Docker environment issues for containerized deployment.
