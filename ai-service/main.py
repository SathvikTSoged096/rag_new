from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from pypdf import PdfReader
import os
from rag_engine import add_documents, load_index, search
from io import BytesIO

app = FastAPI()

# Base directory of AI service
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Upload directory
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Load vector index at startup
@app.on_event("startup")
def startup():
    load_index()

class Query(BaseModel):
    question: str

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):

    # read file in memory
    contents = await file.read()

    # load PDF from memory
    reader = PdfReader(BytesIO(contents))

    text = ""

    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text

    if text.strip() == "":
        return {"message": "PDF has no readable text"}

    # split text
    chunks = chunks = text.split("\n\n")

    add_documents(chunks)

    return {"message": "Textbook uploaded and indexed successfully"}

@app.post("/ask")
def ask_ai(query: Query):

    try:
        answer = search(query.question)
        return {"answer": answer}

    except:
        return {"answer": "No textbook uploaded yet. Please upload notes first."}
    

print("Upload directory:", UPLOAD_DIR)
