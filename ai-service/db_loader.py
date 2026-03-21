import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()


def get_chunks_for_rag(subject_id=None):
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cursor = conn.cursor()

        # ===== QUERY =====
        if subject_id:
            cursor.execute("""
                SELECT s.subject_name, c.title, c.body
                FROM content c
                JOIN subjects s ON c.subject_id = s.subject_id
                WHERE c.body IS NOT NULL AND c.subject_id = %s
                ORDER BY c.unit_number, c.chapter_number, c.section_number
            """, (subject_id,))
        else:
            cursor.execute("""
                SELECT s.subject_name, c.title, c.body
                FROM content c
                JOIN subjects s ON c.subject_id = s.subject_id
                WHERE c.body IS NOT NULL
                ORDER BY c.subject_id, c.unit_number, c.chapter_number
            """)

        rows = cursor.fetchall()

        cursor.close()
        conn.close()

        # ===== PROCESSING =====
        chunks = []

        for row in rows:
            subject_name, title, body = row

            if not body:
                continue

            # structured text (VERY IMPORTANT for RAG)
            full_text = f"{subject_name} - {title}. {body}"

            # split into paragraphs
            paragraphs = [
                p.strip() for p in full_text.split("\n\n")
                if p.strip()
            ]

            # fallback if no paragraph split
            if not paragraphs:
                paragraphs = [full_text]

            # limit chunk size (important for accuracy)
            for p in paragraphs:
                if len(p) > 500:
                    sub_chunks = [p[i:i+500] for i in range(0, len(p), 500)]
                    chunks.extend(sub_chunks)
                else:
                    chunks.append(p)

        return chunks

    except Exception as e:
        print(f"DB ERROR: {e}")
        return []
