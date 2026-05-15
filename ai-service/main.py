import re
import numpy as np

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# =========================
# FASTAPI APP
# =========================
app = FastAPI()


# =========================
# CORS
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# GLOBAL STORAGE
# =========================
documents = []

vectorizer = TfidfVectorizer(
    stop_words="english",
    ngram_range=(1, 2)
)

vectors = None


# =========================
# CLEAN TEXT
# =========================
def clean_text(text):

    text = re.sub(r'\.{2,}', ' ', text)

    text = re.sub(r'\b\d+(\.\d+)*\b', ' ', text)

    text = re.sub(r'\s+', ' ', text)

    return text.strip()


# =========================
# SMART CHUNKING
# =========================
def split_into_chunks(text):

    raw_chunks = text.split("\n")

    chunks = []

    current_chunk = ""

    for line in raw_chunks:

        line = clean_text(line)

        if not line:
            continue

        # detect headings
        if len(line.split()) < 8 and current_chunk:

            chunks.append(current_chunk.strip())

            current_chunk = line + " "

        else:
            current_chunk += line + " "

    if current_chunk:
        chunks.append(current_chunk.strip())

    return chunks


# =========================
# ADD DOCUMENTS
# =========================
def add_documents(text):

    global documents, vectors

    chunks = split_into_chunks(text)

    clean_chunks = []

    for chunk in chunks:

        lower_chunk = chunk.lower()

        if len(chunk.split()) < 5:
            continue

        if "contents" in lower_chunk:
            continue

        clean_chunks.append(chunk)

    documents = clean_chunks

    if documents:
        vectors = vectorizer.fit_transform(documents)
    else:
        vectors = None


# =========================
# SEARCH FUNCTION
# =========================
def search_documents(query):

    global documents, vectors

    if vectors is None or len(documents) == 0:
        return "No document uploaded."

    query_vec = vectorizer.transform([query])

    scores = cosine_similarity(query_vec, vectors)[0]

    best_index = np.argmax(scores)

    best_score = scores[best_index]

    if best_score < 0.1:
        return "No relevant answer found."

    answer = documents[best_index]

    sentences = answer.split(". ")

    final_answer = []

    query_words = query.lower().split()

    for sentence in sentences:

        if any(word in sentence.lower() for word in query_words):
            final_answer.append(sentence)

    if final_answer:
        return ". ".join(final_answer[:3])

    return answer[:500]


# =========================
# HEALTH ROUTE
# =========================
@app.get("/")
def home():
    return {"message": "RAG API Running Successfully"}


# =========================
# UPLOAD ROUTE
# =========================
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):

    try:

        content = await file.read()

        text = content.decode("utf-8", errors="ignore")

        add_documents(text)

        return {
            "status": "success",
            "chunks": len(documents)
        }

    except Exception as e:

        return {
            "status": "error",
            "message": str(e)
        }


# =========================
# SEARCH ROUTE
# =========================
@app.get("/search")
def search(query: str):

    try:

        result = search_documents(query)

        return {
            "query": query,
            "answer": result
        }

    except Exception as e:

        return {
            "error": str(e)
        }
