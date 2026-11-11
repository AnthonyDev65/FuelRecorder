#!/bin/sh
# Escribe la URL de la API en env-config.js al arrancar el contenedor
set -e
if [ -n "$REACT_APP_API_URL" ]; then
  printf 'window.__ENV__ = { REACT_APP_API_URL: "%s" };\n' "$REACT_APP_API_URL" > /usr/share/nginx/html/env-config.js
fi
