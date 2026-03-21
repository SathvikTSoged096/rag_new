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

        # remove useless words
        query_words = [w for w in query_lower.split() if len(w) > 3]

        # STEP 1: keyword filter (section detection)
        filtered_indices = [
            i for i, doc in enumerate(documents)
            if any(word in doc.lower() for word in query_words)
        ]

        # fallback if nothing matched
        if not filtered_indices:
            filtered_indices = list(range(len(documents)))

        # STEP 2: similarity on selected docs
        query_vec = vectorizer.transform([query])

        scores = cosine_similarity(query_vec, vectors)[0]

        # only consider filtered indices
        filtered_scores = [(i, scores[i]) for i in filtered_indices]

        # sort by score
        filtered_scores.sort(key=lambda x: x[1], reverse=True)

        # take top 3
        top_indices = [i for i, _ in filtered_scores[:3]]

        # combine results
        combined_text = " ".join([documents[i] for i in top_indices])

        # clean output
        answer = combined_text.replace("\n", " ").strip()

        return answer[:300] + "..."

    except Exception as e:
        return f"Error processing query: {str(e)}"
