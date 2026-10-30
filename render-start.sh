#!/usr/bin/env bash
# One Render web service runs both processes: the API on 127.0.0.1:4010 (with worker and scheduler jobs)
# and Next.js on $PORT. Calling the API in-process avoids Render's edge rate limit on service-to-service
# traffic over public URLs (the free plan has no private network).
set -euo pipefail
cd "$(dirname "$0")"

(cd tinix-legal && npm run db:mvp:deploy)
(cd tinix-legal && exec npm run start:mvp) &
api=$!

for _ in $(seq 1 90); do
  if curl -fsS http://127.0.0.1:4010/health/live >/dev/null 2>&1; then break; fi
  if ! kill -0 "$api" 2>/dev/null; then echo "API exited during startup" >&2; exit 1; fi
  sleep 1
done

cd limi-product
exec npm run start
