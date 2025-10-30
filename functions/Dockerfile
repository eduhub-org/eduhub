FROM python:3.11-slim-bullseye

# Installiere Build-Tools und Cairo-Entwicklungsbibliotheken
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /functions