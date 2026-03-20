from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from pypdf import PdfReader
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

from rag_engine import add_documents, search
from db_loader import get_chunks_for_rag

load_dotenv()

app = FastAPI()

# Allow LMS frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your LMS URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class Query(BaseModel):
    question: str
    subject_id: int = None  # optional: filter by subject

@app.on_event("startup")
async def load_db_content():
    """Auto-load ALL course content from DB when server starts"""
    chunks = get_chunks_for_rag()
    if chunks:
        add_documents(chunks)
        print(f"Loaded {len(chunks)} chunks from DB into RAG")
    else:
        print(" No content in DB yet")

@app.get("/")
def home():
    return {"message": "AI service running"}

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """Keep existing PDF upload — still works"""
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        t = page.extract_text()
        if t:
            text += t

    chunks = text.split("\n\n")
    add_documents(chunks)
    return {"message": "Uploaded successfully"}

@app.post("/ask")
def ask_ai(query: Query):
    """Answer student question, optionally filtered by subject"""
    if query.subject_id:
        # Reload only that subject's content before answering
        chunks = get_chunks_for_rag(query.subject_id)
        if chunks:
            add_documents(chunks)
    answer = search(query.question)
    return {"answer": answer}

@app.post("/reload-db")
async def reload_from_db(subject_id: int = None):
    """Call this after instructor adds new content"""
    chunks = get_chunks_for_rag(subject_id)
    if chunks:
        add_documents(chunks)
        return {"message": f"Reloaded {len(chunks)} chunks from DB"}
    return {"message": "No content found in DB"}
