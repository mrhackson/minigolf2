FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p /data && chmod 700 /data

EXPOSE 8000

# Development server for local use; use a production WSGI server in deployed environments.
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
