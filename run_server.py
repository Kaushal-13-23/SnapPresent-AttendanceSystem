#!/usr/bin/env python3
"""
Dynamic multi-port launcher for Railway and production environments.
Binds Gunicorn to both Port 5000 and Port 8080 (and $PORT if specified),
ensuring Railway's public domain router connects seamlessly regardless
of whether the domain was generated for Port 5000 or Port 8080.
"""
import os
import sys
import subprocess

# Set of all ports to bind
ports = {5000, 8080}
env_port = os.environ.get("PORT")
if env_port and env_port.isdigit():
    ports.add(int(env_port))

bind_args = []
for p in sorted(ports):
    bind_args.extend(["--bind", f"0.0.0.0:{p}"])

cmd = [
    "gunicorn",
    *bind_args,
    "--workers", "1",
    "--threads", "4",
    "--timeout", "180",
    "--chdir", "backend",
    "app:app"
]

print(f"🚀 Starting Gunicorn bound to ports {sorted(ports)}: {' '.join(cmd)}", flush=True)
sys.exit(subprocess.call(cmd))
