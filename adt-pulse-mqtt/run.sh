#!/bin/sh
set -e

CONFIG_PATH=/data/options.json

# Trap signals and forward to child process
cleanup() {
    echo "Received shutdown signal, forwarding to application..."
    if [ -n "$PID" ]; then
        kill -TERM "$PID" 2>/dev/null
        wait "$PID"
    fi
    exit 0
}

trap cleanup TERM INT

# start server in background so we can trap signals
npm start &
PID=$!

# Wait for the process
wait "$PID"
