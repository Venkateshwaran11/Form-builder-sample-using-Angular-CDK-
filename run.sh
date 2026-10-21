#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status during dependency check
set -e

# Resolve the root directory of the project (where this script lives)
SCRIPT_DIR="$(cd "$(dirname "$0")" >/dev/null 2>&1 && pwd)"
FRONTEND_DIR="$SCRIPT_DIR"
BACKEND_DIR="$SCRIPT_DIR/api"

echo "======================================================"
echo "   Form Builder - Development Server Launcher"
echo "======================================================"

# Verify project directories and package.json files
if [ ! -f "$FRONTEND_DIR/package.json" ]; then
    echo "❌ Error: Frontend package.json not found in $FRONTEND_DIR"
    exit 1
fi

if [ ! -d "$BACKEND_DIR" ] || [ ! -f "$BACKEND_DIR/package.json" ]; then
    echo "❌ Error: Backend package.json not found in $BACKEND_DIR"
    exit 1
fi

# Function to detect preferred package manager
detect_pm() {
    local target_dir="$1"
    if [ -f "$target_dir/yarn.lock" ] && command -v yarn >/dev/null 2>&1; then
        echo "yarn"
    elif [ -f "$target_dir/pnpm-lock.yaml" ] && command -v pnpm >/dev/null 2>&1; then
        echo "pnpm"
    else
        echo "npm"
    fi
}

# --- 1. Check and install Frontend dependencies ---
echo ""
echo "🔍 Checking Frontend dependencies..."
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    FE_PM=$(detect_pm "$FRONTEND_DIR")
    echo "⚠️  Frontend 'node_modules' not found in $FRONTEND_DIR."
    echo "📦 Installing frontend dependencies using $FE_PM..."
    (cd "$FRONTEND_DIR" && $FE_PM install)
    echo "✅ Frontend dependencies installed successfully."
else
    echo "✅ Frontend 'node_modules' is present."
fi

# --- 2. Check and install Backend dependencies ---
echo ""
echo "🔍 Checking Backend dependencies..."
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    BE_PM=$(detect_pm "$BACKEND_DIR")
    echo "⚠️  Backend 'node_modules' not found in $BACKEND_DIR."
    echo "📦 Installing backend dependencies using $BE_PM..."
    (cd "$BACKEND_DIR" && $BE_PM install)
    echo "✅ Backend dependencies installed successfully."
else
    echo "✅ Backend 'node_modules' is present."
fi

# Disable exit on error for server runtime
set +e

echo ""
echo "======================================================"
echo "   Starting Servers (Frontend & Backend)"
echo "======================================================"
echo "💡 Press Ctrl+C to stop both servers."
echo ""

BACKEND_PID=""
FRONTEND_PID=""

# Graceful cleanup on exit or interruption
cleanup() {
    trap - INT TERM EXIT
    echo ""
    echo "🛑 Shutting down development servers..."
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    wait 2>/dev/null || true
    echo "✅ All development servers stopped."
    exit 0
}

trap cleanup INT TERM EXIT

# --- 3. Start Backend Server in Background ---
echo "🚀 [Backend] Starting Express API server..."
(cd "$BACKEND_DIR" && node index.js) &
BACKEND_PID=$!

# Brief pause to verify backend process didn't terminate immediately
sleep 1
if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "❌ [Backend] Failed to start backend server. Please check api/index.js logs."
    exit 1
fi
echo "✅ [Backend] Running (PID: $BACKEND_PID)"

# --- 4. Start Frontend Server in Foreground ---
echo "🚀 [Frontend] Starting Angular development server..."
cd "$FRONTEND_DIR"
if [ $# -gt 0 ]; then
    npm start -- "$@"
else
    npm start
fi