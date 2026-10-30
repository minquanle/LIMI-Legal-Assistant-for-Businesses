# The community registry is unavailable; build the pinned official security release.
FROM golang:1.24-bookworm@sha256:1a6d4452c65dea36aac2e2d606b01b4a029ec90cc1ae53890540ce6173ea77ac AS builder
RUN CGO_ENABLED=0 go install github.com/minio/minio@RELEASE.2025-10-15T17-29-55Z
FROM debian:bookworm-slim@sha256:7c7b2c966bc9ee8cedfeef67e0e279108992c77681fa595db4a9d65c06ccc587
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl && rm -rf /var/lib/apt/lists/*
COPY --from=builder /go/bin/minio /usr/local/bin/minio
RUN useradd --uid 10001 --create-home minio && mkdir /data && chown minio:minio /data
USER 10001:10001
EXPOSE 9000 9001
ENTRYPOINT ["minio"]
