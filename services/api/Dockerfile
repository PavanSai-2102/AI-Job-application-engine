FROM mcr.microsoft.com/playwright/python:v1.40.0-jammy

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Explicitly install chromium browser for playwright
RUN python -m playwright install chromium
RUN python -m playwright install-deps chromium

COPY . .

# Use dynamic PORT for Render/Railway
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
