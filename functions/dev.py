import ast
import os
import subprocess
from flask import Flask, request, jsonify
import sys
import importlib.util

# Create both Flask apps at the module level
app = Flask(__name__)
api_proxy_app = Flask('api_proxy')

def load_env_vars(file_path):
    if not os.path.exists(file_path):
        return

    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("#") or not line:
                continue
            if line.startswith("export "):
                line = line[7:].lstrip()
            if "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip()
            if (
                len(value) >= 2
                and value[0] == value[-1]
                and value[0] in ('"', "'")
            ):
                try:
                    value = ast.literal_eval(value)
                except (ValueError, SyntaxError):
                    value = value[1:-1]
            os.environ[key] = value
    print(f"Environment variables loaded from {file_path}")


# Change working directory to callPythonFunction
os.chdir("./callPythonFunction/")

# Import the Flask app from main.py in the callPythonFunction folder
sys.path.insert(0, ".")

spec = importlib.util.spec_from_file_location("main", "./main.py")
main_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(main_module)

# Revert the working directory change
os.chdir("..")


@app.route("/", methods=["POST"])
def handle_request():
    return main_module.call_python_function(request)


@api_proxy_app.route("/<path:subpath>", methods=["GET", "POST", "OPTIONS"])
def handle_api_proxy(subpath):
    # Use absolute path based on the current file's location
    current_dir = os.path.dirname(os.path.abspath(__file__))
    api_proxy_dir = os.path.join(current_dir, "apiProxy")
    api_proxy_path = os.path.join(api_proxy_dir, "main.py")
    
    # Add apiProxy directory to sys.path so relative imports work
    if api_proxy_dir not in sys.path:
        sys.path.insert(0, api_proxy_dir)
    
    # Force-reload modules to pick up code changes without restarting the dev server
    import importlib
    import sys as _sys
    importlib.invalidate_caches()
    for mod_name in [
        "api_proxy_main",
        "participant_data_handler",
        "security_handler",
        "api_clients.eduhub_client",
        "course_id_utils",
    ]:
        if mod_name in _sys.modules:
            _sys.modules.pop(mod_name, None)

    # Import apiProxy module using absolute path
    api_proxy_spec = importlib.util.spec_from_file_location("api_proxy_main", api_proxy_path)
    api_proxy_module = importlib.util.module_from_spec(api_proxy_spec)
    api_proxy_spec.loader.exec_module(api_proxy_module)
    return api_proxy_module.handle_request(request)


def main():
    # Get the current PYTHONPATH
    python_path = os.environ.get('PYTHONPATH', '')
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Update environment with PYTHONPATH
    env = os.environ.copy()
    env['PYTHONPATH'] = f"{current_dir}:{python_path}"

    # Start the main Flask server in a separate process
    main_process = subprocess.Popen([sys.executable, '-c',
        'from dev import app; app.run(host="0.0.0.0", port=42025, debug=True)'],
        env=env)
    
    # Start the API proxy Flask server in a separate process
    api_process = subprocess.Popen([sys.executable, '-c',
        'from dev import api_proxy_app; api_proxy_app.run(host="0.0.0.0", port=42026, debug=True)'],
        env=env)
    
    try:
        # Wait for both processes to complete
        main_process.wait()
        api_process.wait()
    except KeyboardInterrupt:
        # Gracefully handle Ctrl+C
        main_process.terminate()
        api_process.terminate()
        main_process.wait()
        api_process.wait()


if __name__ == "__main__":
    _base = os.path.dirname(os.path.abspath(__file__))
    # Same repo-root .env docker-compose uses for python_functions (see environment: ${VAR:-}).
    load_env_vars(os.path.join(_base, "..", ".env"))
    main()
