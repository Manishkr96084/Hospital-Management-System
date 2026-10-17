import subprocess
import sys
import os
import time
import signal

def run():
    print("==========================================================")
    print("  MEDIVANTA AI ")
    print("==========================================================")
    
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")
    
    # Python executable inside venv
    if os.name == 'nt':
        python_exe = os.path.join(backend_dir, "venv", "Scripts", "python.exe")
        npm_cmd = "npm.cmd"
    else:
        python_exe = os.path.join(backend_dir, "venv", "bin", "python")
        npm_cmd = "npm"

    if not os.path.exists(python_exe):
        python_exe = sys.executable

    print("\n1. Seeding / Verifying Database...")
    subprocess.run([python_exe, "seed_db.py"], cwd=backend_dir)

    print("\n2. Starting FastAPI Backend (http://localhost:8000)...")
    backend_proc = subprocess.Popen(
        [python_exe, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
        cwd=backend_dir
    )

    print("\n3. Starting React Frontend (http://localhost:5173)...")
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=frontend_dir,
        shell=True if os.name == 'nt' else False
    )

    print("\n==========================================================")
    print("  Medivanta AI Platform is running!")
    print("  • Frontend: http://localhost:5173")
    print("  • Backend API Docs: http://localhost:8000/docs")
    print("  Press Ctrl + C in this terminal to shut down.")
    print("==========================================================\n")

    def signal_handler(sig, frame):
        print("\nShutting down Medivanta AI services...")
        backend_proc.terminate()
        frontend_proc.terminate()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        backend_proc.terminate()
        frontend_proc.terminate()
        print("Services stopped.")

if __name__ == "__main__":
    run()
