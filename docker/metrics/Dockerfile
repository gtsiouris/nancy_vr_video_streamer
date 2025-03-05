FROM python:3.9-slim

WORKDIR /app

COPY metrics/api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY metrics/api/ .


RUN mkdir -p /data


ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV DATA_DIR=/data


CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]