import os

# Definir antes de qualquer import da app (engine SQLite em memória para testes).
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["JWT_SECRET"] = "test-secret-key-for-pytest-min-32-chars!"
os.environ["CORS_ORIGINS"] = "http://localhost:5173"
