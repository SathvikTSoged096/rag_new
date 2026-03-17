from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from pypdf import PdfReader
import os

from rag_engine import add_documents, search

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

os.makedirs(UPLOAD_DIR, exist_ok=True)

class Query(BaseModel):
    question: str

@app.get("/")
def home():
    return {"message": "AI service running"}

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as f:
        f.write(await file.read())

    reader = PdfReader(file_path)

    text = ""
    for page in reader.pages:
        t = page.extract_text()
        if t:
            text += t

     chunks = chunks = text.split("\n\n")

    add_documents(chunks)

    return {"message": "Uploaded successfully"}

@app.post("/ask")
def ask_ai(query: Query):
    answer = search(query.question)
    return {"answer": answer}
