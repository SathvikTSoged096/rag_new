import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# storage
documents = []

# improved vectorizer
vectorizer = TfidfVectorizer(stop_words="english")

vectors = None


def add_documents(chunks):
    global documents, vectors

    # clean chunks (remove empty ones)
    clean_chunks = [c.strip() for c in chunks if c.strip()]

    documents.extend(clean_chunks)

    # create embeddings
    vectors = vectorizer.fit_transform(documents)


def search(query):
    global vectors

    if vectors is None or len(documents) == 0:
        return "No data available. Please upload a textbook first."

    query_lower = query.lower()

    # remove small words (like "what", "is")
    query_words = [w for w in query_lower.split() if len(w) > 3]

    # 🔥 STEP 1: filter relevant sections
    filtered_docs = [
        doc for doc in documents
        if any(word in doc.lower() for word in query_words)
    ]

    # fallback if nothing matched
    if not filtered_docs:
        filtered_docs = documents

    # 🔥 STEP 2: vectorize filtered docs
    temp_vectors = vectorizer.fit_transform(filtered_docs)

    query_vec = vectorizer.transform([query])

    scores = cosine_similarity(query_vec, temp_vectors)[0]

    # 🔥 STEP 3: best match
    best_index = scores.argmax()

    answer = filtered_docs[best_index].replace("\n", " ").strip()

    # 🔥 STEP 4: return short clean answer
    return answer[:300] + "..."
    # get top 3 relevant chunks
    top_indices = scores.argsort()[-3:][::-1]

    # combine best chunks
    combined_text = " ".join([documents[i] for i in top_indices])

    # clean output
    answer = combined_text.replace("\n", " ").strip()

    # return short, readable answer
    return answer[:300] + "..."
