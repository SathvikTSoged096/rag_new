import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def get_chunks_for_rag(subject_id=None):
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cursor = conn.cursor()
    
    if subject_id:
        cursor.execute("""
            SELECT c.content_id, s.subject_name, c.title, c.body
            FROM content c
            JOIN subjects s ON c.subject_id = s.subject_id
            WHERE c.body IS NOT NULL 
            AND c.subject_id = %s
            ORDER BY c.unit_number, c.chapter_number, c.section_number
        """, (subject_id,))
    else:
        cursor.execute("""
            SELECT c.content_id, s.subject_name, c.title, c.body
            FROM content c
            JOIN subjects s ON c.subject_id = s.subject_id
            WHERE c.body IS NOT NULL
            ORDER BY c.subject_id, c.unit_number, c.chapter_number
        """)
    
    rows = cursor.fetchall()
    conn.close()
    
    chunks = []
    for row in rows:
        content_id, subject_name, title, body = row
        full_text = f"Subject: {subject_name}. Topic: {title}. {body}"
        paragraphs = [p.strip() for p in full_text.split('\n\n') if p.strip()]
        chunks.extend(paragraphs if paragraphs else [full_text])
    
    return chunks
