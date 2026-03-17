import os
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# storage
documents = []
vectorizer = TfidfVectorizer()
vectors = None

def add_documents(chunks):
    global documents, vectors

    documents.extend(chunks)

    # create embeddings
    vectors = vectorizer.fit_transform(documents)

def search(query):
    global vectors

    if vectors is None or len(documents) == 0:
        return "No data available"

    query_vec = vectorizer.transform([query])

    scores = cosine_similarity(query_vec, vectors)

    best_index = np.argmax(scores)

    return documents[best_index]
