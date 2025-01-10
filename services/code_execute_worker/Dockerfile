FROM python:3.9-slim

RUN apt-get update && apt-get install -y \
    docker.io \
    && apt-get clean

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8012

CMD ["python", "-m", "app.worker"]