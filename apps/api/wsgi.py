"""
WSGI entrypoint for PythonAnywhere & traditional WSGI web servers.
Adapts FastAPI (ASGI) to WSGI using a2wsgi.
"""
import os
import sys

# Pastikan direktori apps/api ada di sys.path
api_dir = os.path.dirname(os.path.abspath(__file__))
if api_dir not in sys.path:
    sys.path.insert(0, api_dir)

from a2wsgi import ASGIMiddleware
from main import app as fastapi_app

# PythonAnywhere membutuhkan variabel bernama 'application'
application = ASGIMiddleware(fastapi_app)
