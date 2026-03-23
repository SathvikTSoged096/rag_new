import psycopg2
import os
from urllib.parse import urlparse

def get_chunks_for_rag(subject_id=None):
    try:
        db_url = os.getenv("DATABASE_URL")

        if not db_url:
            print("❌ DATABASE_URL not found")
            return []

        print("✅ DB URL loaded")

        # 🔥 Parse DB URL (fix for Neon + Render)
        result = urlparse(db_url)

        conn = psycopg2.connect(
            dbname=result.path[1:],   # remove '/'
            user=result.username,
            password=result.password,
            host=result.hostname,
            port=result.port,
            sslmode="require"
        )

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

        for subject_name, title, body in rows:

            if not body:
                continue

            full_text = f"{subject_name} - {title}. {body}"

            paragraphs = [
                p.strip() for p in full_text.split("\n\n")
                if p.strip()
            ]

            if not paragraphs:
                paragraphs = [full_text]

            for p in paragraphs:
                if len(p) > 500:
                    sub_chunks = [p[i:i+500] for i in range(0, len(p), 500)]
                    chunks.extend(sub_chunks)
                else:
                    chunks.append(p)

        print(f"✅ Loaded {len(chunks)} chunks")

        return chunks

    except Exception as e:
        print(f"❌ DB ERROR: {e}")
        return []
