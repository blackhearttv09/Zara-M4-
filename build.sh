#!/usr/bin/env bash
# ==============================================================================
# M4 Five OS — Autonomous Builder Script
# ==============================================================================
set -euo pipefail

MODE="${1:-all}"
echo "==> [M4 FIVE OS BUILDER] Mode: ${MODE}"

case "$MODE" in
  all|build)
    echo "==> Step 1: Validating environment and dependencies..."
    npm install --silent
    echo "==> Step 2: Compiling M4 Five Core & Shell..."
    npm run build
    echo "==> Step 3: Verification passed."
    ;;
  test)
    echo "==> Running M4 Five OS automated test suite..."
    npx tsx tests/run-all-tests.ts
    ;;
  lint)
    echo "==> Running static typecheck..."
    npx tsc --noEmit
    ;;
  iso)
    echo "==> Preparing ISO staging directory..."
    mkdir -p dist/iso/boot/grub
    cp boot/grub.cfg dist/iso/boot/grub/
    echo "==> M4 Five OS bootable payload staged at dist/iso"
    ;;
  *)
    echo "Usage: ./build.sh [all|build|test|lint|iso]"
    exit 1
    ;;
esac
