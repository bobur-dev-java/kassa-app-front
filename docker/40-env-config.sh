#!/bin/sh
set -eu

escape_for_js() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

API_BASE_URL="$(escape_for_js "${VITE_API_BASE_URL:-}")"
APP_TITLE="$(escape_for_js "${VITE_APP_TITLE:-Kassa App}")"

cat <<EOF >/usr/share/nginx/html/env-config.js
window.__APP_CONFIG__ = {
  VITE_API_BASE_URL: "${API_BASE_URL}",
  VITE_APP_TITLE: "${APP_TITLE}"
}
EOF
