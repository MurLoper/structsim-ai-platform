#!/bin/bash
cd "$(dirname "$0")"
echo "Starting tests..."
npx vitest run --reporter=verbose 2>&1
echo "Tests complete with exit code: $?"
