import psycopg2
import os
from urllib.parse import urlparse
import json

def get_chunks_for_rag(subject_id=None):
    try:
        db_url = os.getenv("DATABASE_URL")

        if not db_url:
            print("❌ DATABASE_URL not found")
            return []

        print("✅ DB URL loaded")

        # Parse DB URL 
        result = urlparse(db_url)

        conn = psycopg2.connect(
            dbname=result.path[1:],   
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
                SELECT id as subject_id, title as subject_name, units
                FROM subjects
                WHERE units IS NOT NULL AND jsonb_array_length(units) > 0 AND id = %s
            """, (subject_id,))
        else:
            cursor.execute("""
                SELECT id as subject_id, title as subject_name, units
                FROM subjects
                WHERE units IS NOT NULL AND jsonb_array_length(units) > 0
            """)

        rows = cursor.fetchall()

        cursor.close()
        conn.close()

        # ===== PROCESSING =====
        chunks = []

        for subject_id, subject_name, units_json in rows:
            if not units_json:
                continue
                
            # Parse JSONB
            units = units_json if isinstance(units_json, list) else json.loads(units_json)
            
            # Extract all paragraphs from deeply nested JSON 
            all_paragraphs = []
            
            for unit in units:
                for chapter in unit.get('chapters', []):
                    for section in chapter.get('sections', []):
                        if section.get('title'):
                            all_paragraphs.append(f"{subject_name} - {section['title']}.")
                        
                        for p in section.get('paragraphs', []):
                            if p and isinstance(p, str) and not p.startswith('[PDF]'):
                                all_paragraphs.append(p.strip())

            if not all_paragraphs:
                continue

            for p in all_paragraphs:
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
