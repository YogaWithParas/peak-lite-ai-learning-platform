#!/bin/sh
# Production start command for Render (see render.yaml's dockerCommand).
# Kept as a real script instead of an inline dockerCommand string because
# Render's dockerCommand field doesn't reliably parse nested quotes/&&.
set -e

python manage.py migrate

# Idempotent (every row uses get_or_create), so safe to run on every boot.
# Render's free plan has no Shell access, so this is the only way to seed data.
python manage.py seed_demo_data

exec gunicorn peak_lite.wsgi:application --bind 0.0.0.0:$PORT
