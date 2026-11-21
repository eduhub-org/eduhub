"""Shared test fixtures for callPythonFunction unit tests.

The Python serverless function imports are relative to
``functions/callPythonFunction`` and ``functions/shared_py``. These
paths are added to ``sys.path`` here so tests can be run from the
repository root via ``pytest functions/callPythonFunction/__tests__``.
"""
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SHARED_PY = ROOT / "functions" / "shared_py"
FUNCTION_ROOT = ROOT / "functions" / "callPythonFunction"

for path in (str(SHARED_PY), str(FUNCTION_ROOT)):
    if path not in sys.path:
        sys.path.insert(0, path)

# Avoid accidental network calls from ZoomClient.__init__ during tests;
# we always use ZoomClient.__new__ in tests so these are just safety nets.
os.environ.setdefault("ZOOM_API_KEY", "test-key")
os.environ.setdefault("ZOOM_API_SECRET", "test-secret")
os.environ.setdefault("ZOOM_ACCOUNT_ID", "test-account")
