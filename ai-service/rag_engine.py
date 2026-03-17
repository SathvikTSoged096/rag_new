import faiss
import numpy as np
import pickle
import os
from sentence_transformers import SentenceTransformer
import re

model = SentenceTransformer("all-MiniLM-L6-v2")

documents = []

index = faiss.IndexFlatL2(384)

# absolute path to vector_db
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VECTOR_DIR = os.path.join(BASE_DIR, "vector_db")

INDEX_FILE = os.path.join(VECTOR_DIR, "index.faiss")
DOC_FILE = os.path.join(VECTOR_DIR, "docs.pkl")


def add_documents(chunks):

    global documents, index

    # ensure vector_db directory exists
    os.makedirs(VECTOR_DIR, exist_ok=True)

    # DEBUG
    print("VECTOR DIR:", VECTOR_DIR)

    # test file write permission
    test_file = os.path.join(VECTOR_DIR, "test.txt")
    with open(test_file, "w") as f:
        f.write("test")

    embeddings = model.encode(chunks)

    index.add(np.array(embeddings))

    documents.extend(chunks)

    # save FAISS index
    faiss.write_index(index, INDEX_FILE)

    # save docs
    with open(DOC_FILE, "wb") as f:
        pickle.dump(documents, f)


def load_index():

    global documents, index

    os.makedirs(VECTOR_DIR, exist_ok=True)

    if os.path.exists(INDEX_FILE):

        index = faiss.read_index(INDEX_FILE)

        if os.path.exists(DOC_FILE):

            with open(DOC_FILE, "rb") as f:
                documents = pickle.load(f)

def search(query):

    if len(documents) == 0:
        return "No textbook uploaded yet."

    q_embed = model.encode([query])
    D, I = index.search(np.array(q_embed), 1)

    chunk = documents[I[0][0]]

    # split chunk into sentences
    sentences = re.split(r'(?<=[.!?]) +', chunk)

    # return the most relevant sentence
    for s in sentences:
        if any(word.lower() in s.lower() for word in query.split()):
            return s

    return sentences[0]