import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# storage
documents = []

# better vectorizer (removes common words)
vectorizer = TfidfVectorizer(stop_words="english")

vectors = None


def add_documents(chunks):
    global documents, vectors

    # clean chunks (remove empty text)
    clean_chunks = [c.strip() for c in chunks if c.strip()]

    documents.extend(clean_chunks)

    # create embeddings
    vectors = vectorizer.fit_transform(documents)


def search(query):
    global vectors

    if vectors is None or len(documents) == 0:
        return "No data available. Please upload a textbook first."

    # convert query to vector
    query_vec = vectorizer.transform([query])

    # similarity scores
    scores = cosine_similarity(query_vec, vectors)[0]

    # get top 3 relevant chunks
    top_indices = scores.argsort()[-3:][::-1]

    # combine best chunks
    combined_text = " ".join([documents[i] for i in top_indices])

    # clean output
    answer = combined_text.replace("\n", " ").strip()

    # return short, readable answer
    return answer[:300] + "..."
