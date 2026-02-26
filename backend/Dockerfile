FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Render uses port 10000, fallback to $PORT env var
EXPOSE 10000

# Start with PORT env var (Render sets this automatically)
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}
