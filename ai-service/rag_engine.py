import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# storage
documents = []

# better vectorizer
vectorizer = TfidfVectorizer(stop_words="english")

vectors = None


def add_documents(chunks):
    global documents, vectors

    # clean chunks
    clean_chunks = [c.strip() for c in chunks if c.strip()]

    documents.extend(clean_chunks)

    # build embeddings safely
    if documents:
        vectors = vectorizer.fit_transform(documents)


def search(query):
    global vectors

    if vectors is None or len(documents) == 0:
        return "No data available. Please upload or load content."

    try:
        query_lower = query.lower()

        # remove small useless words
        query_words = [w for w in query_lower.split() if len(w) > 3]

        # STEP 1: filter relevant sections
        filtered_indices = [
            i for i, doc in enumerate(documents)
            if any(word in doc.lower() for word in query_words)
        ]

        # fallback
        if not filtered_indices:
            filtered_indices = list(range(len(documents)))

        # STEP 2: similarity search
        query_vec = vectorizer.transform([query])

        scores = cosine_similarity(query_vec, vectors)[0]

        # only filtered docs
        filtered_scores = [(i, scores[i]) for i in filtered_indices]

        # sort best match
        filtered_scores.sort(key=lambda x: x[1], reverse=True)

        # BEST MATCH ONLY
        best_index = filtered_scores[0][0]

        answer = documents[best_index].replace("\n", " ").strip()

        # short clean response
        return answer[:500]

    except Exception as e:
        return f"Error processing query: {str(e)}"
