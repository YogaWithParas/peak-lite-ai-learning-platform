#!/bin/sh
# Production start command for Render (see render.yaml's dockerCommand).
# Kept as a real script instead of an inline dockerCommand string because
# Render's dockerCommand field doesn't reliably parse nested quotes/&&.
set -e

python manage.py migrate

exec gunicorn peak_lite.wsgi:application --bind 0.0.0.0:$PORT
