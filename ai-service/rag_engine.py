import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# storage
documents = []

# improved vectorizer
vectorizer = TfidfVectorizer(
    stop_words="english",
    ngram_range=(1, 2)
)

vectors = None


# CLEAN TEXT
def clean_text(text):
    text = re.sub(r'\.{2,}', ' ', text)  # remove dotted lines
    text = re.sub(r'\b\d+(\.\d+)*\b', ' ', text)  # remove page numbers
    text = re.sub(r'\s+', ' ', text)  # extra spaces
    return text.strip()


def add_documents(chunks):
    global documents, vectors

    clean_chunks = []

    for chunk in chunks:
        chunk = clean_text(chunk)

        # skip tiny or useless chunks
        if len(chunk.split()) < 5:
            continue

        # remove TOC-like chunks
        if "contents" in chunk.lower():
            continue

        clean_chunks.append(chunk)

    documents.extend(clean_chunks)

    if documents:
        vectors = vectorizer.fit_transform(documents)


def search(query):
    global vectors

    if vectors is None or len(documents) == 0:
        return "No data available."

    try:
        # vectorize query
        query_vec = vectorizer.transform([query])

        # similarity
        scores = cosine_similarity(query_vec, vectors)[0]

        # best result
        best_index = np.argmax(scores)

        # confidence check
        if scores[best_index] < 0.1:
            return "No relevant answer found."

        answer = documents[best_index]

        return answer[:500]

    except Exception as e:
        return f"Error: {str(e)}"
