import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

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
# TEXT CLEANING
# =========================
def clean_text(text):
    # remove dotted lines
    text = re.sub(r'\.{2,}', ' ', text)

    # remove page numbers like 1.1 / 2 / 3.4
    text = re.sub(r'\b\d+(\.\d+)*\b', ' ', text)

    # remove extra spaces/newlines
    text = re.sub(r'\s+', ' ', text)

    return text.strip()


# =========================
# ADD DOCUMENTS
# =========================
def add_documents(chunks):
    global documents, vectors

    clean_chunks = []

    for chunk in chunks:

        if not chunk.strip():
            continue

        chunk = clean_text(chunk)

        lower_chunk = chunk.lower()

        # skip very tiny chunks
        if len(chunk.split()) < 5:
            continue

        # remove table of contents
        if "contents" in lower_chunk:
            continue

        # remove useless chapter headings
        if "chapter" in lower_chunk and len(chunk.split()) < 15:
            continue

        clean_chunks.append(chunk)

    # IMPORTANT:
    # Replace old documents completely
    documents = clean_chunks

    # build vectors
    if documents:
        vectors = vectorizer.fit_transform(documents)
    else:
        vectors = None


# =========================
# SEARCH FUNCTION
# =========================
def search(query):
    global vectors, documents

    # no data check
    if vectors is None or len(documents) == 0:
        return "No data available. Please upload a document."

    try:
        query = clean_text(query)

        # query vector
        query_vec = vectorizer.transform([query])

        # cosine similarity
        scores = cosine_similarity(query_vec, vectors)[0]

        # best match index
        best_index = np.argmax(scores)

        # confidence score
        best_score = scores[best_index]

        # low confidence protection
        if best_score < 0.1:
            return "No relevant answer found."

        # get answer
        answer = documents[best_index]

        # clean final response
        answer = answer.replace("\n", " ").strip()

        return answer[:700]

    except Exception as e:
        return f"Error processing query: {str(e)}"


# =========================
# OPTIONAL DEBUG FUNCTION
# =========================
def debug_search(query):
    global vectors, documents

    query_vec = vectorizer.transform([query])

    scores = cosine_similarity(query_vec, vectors)[0]

    top_indices = np.argsort(scores)[::-1][:5]

    print("\nTOP MATCHES:\n")

    for idx in top_indices:
        print(f"Score: {scores[idx]:.4f}")
        print(documents[idx][:300])
        print("-" * 50)
