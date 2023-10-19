import os
import subprocess
from flask import Flask, request, jsonify
import sys
import importlib.util


def load_env_vars(file_path):
    if not os.path.exists(file_path):
        print(f"Environment file {file_path} not found.")
        return

    print(f"Environment variables loaded from {file_path}")
    with open(file_path, "r") as f:
        for line in f:
            line = line.strip()
            if line.startswith("#") or not line:
                continue

            key, value = line.split("=", 1)
            os.environ[key] = value


# Change working directory to callPythonFunction
os.chdir("./callPythonFunction/")

# Import the Flask app from main.py in the callPythonFunction folder
sys.path.insert(0, ".")

spec = importlib.util.spec_from_file_location("main", "./main.py")
main_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(main_module)

app = Flask(__name__)
# app = main_module.app

# Revert the working directory change
os.chdir("..")


@app.route("/", methods=["POST"])
def handle_request():
    return jsonify(main_module.call_python_function(request))


def main():
    # Start the Flask server
    app.run(host="0.0.0.0", port=42025, debug=True, use_reloader=True)


if __name__ == "__main__":
    load_env_vars("./start-python.env")
    main()
