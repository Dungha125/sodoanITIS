"""Seed thủ công — KHÔNG chạy tự động khi deploy.

Chỉ dùng khi cần reset roles/admin trên môi trường dev:
    python scripts/init_db.py
"""
import sys
from pathlib import Path

if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from scripts.init_db import main
    print("seed_data.py đã được thay bằng init_db.py (an toàn, không ghi đè data).")
    main()
