FROM python:3.13-alpine

WORKDIR /app
COPY server.py ./server.py

RUN addgroup -S analytics && adduser -S analytics -G analytics \
  && mkdir -p /data && chown -R analytics:analytics /data /app

USER analytics
ENV PORT=8080
ENV ANALYTICS_DB_PATH=/data/analytics.sqlite3

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["wget", "--spider", "-q", "http://127.0.0.1:8080/health"]

CMD ["python", "-u", "server.py"]
