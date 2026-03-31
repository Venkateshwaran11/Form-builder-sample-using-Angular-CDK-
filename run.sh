#!/usr/bin/env sh
# run.sh — simple helper to install deps and run an Angular app (serve)
set -e

# move to script directory (project root when run from file location)
SCRIPT_DIR="$(cd "$(dirname "$0")" >/dev/null 2>&1 && pwd || printf "%s" "$(dirname "$0")")"
cd "$SCRIPT_DIR"

# check project
if [ ! -f package.json ]; then
    echo "Error: package.json not found. Run this from your Angular project root."
    exit 1
fi

# pick package manager
if command -v yarn >/dev/null 2>&1 || [ -f yarn.lock ]; then
    PM="yarn"; INSTALL_CMD="yarn install"; START_CMD="yarn start"; SERVE_CMD="yarn serve"
elif command -v pnpm >/dev/null 2>&1 || [ -f pnpm-lock.yaml ]; then
    PM="pnpm"; INSTALL_CMD="pnpm install"; START_CMD="pnpm start"; SERVE_CMD="pnpm serve"
else
    PM="npm"; INSTALL_CMD="npm install"; START_CMD="npm run start"; SERVE_CMD="npm run serve"
fi

# install deps if needed
if [ ! -d node_modules ]; then
    echo "Installing dependencies with $PM..."
    $INSTALL_CMD
fi

# prefer global Angular CLI if available
if command -v ng >/dev/null 2>&1; then
    echo "Using global Angular CLI: ng serve"
    exec ng serve --open "$@"
fi

# fall back to npm/yarn/pnpm scripts
if grep -q "\"start\"" package.json 2>/dev/null; then
    echo "Running start script with $PM..."
    exec sh -c "$START_CMD -- $*"
elif grep -q "\"serve\"" package.json 2>/dev/null; then
    echo "Running serve script with $PM..."
    exec sh -c "$SERVE_CMD -- $*"
else
    echo "No Angular CLI found and no start/serve script in package.json."
    echo "You can install @angular/cli (npm i -g @angular/cli) or add a start script."
    exit 1
fi