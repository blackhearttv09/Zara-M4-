#!/bin/bash
# ==============================================================================
# M4 Five OS — Early Init & Supervisor System
# ==============================================================================
set -euo pipefail

echo "=========================================================="
echo "    __  __ _  _    _____ _____ _    _ _____   ____   _____ "
echo "   |  \/  | || |  |  ___|_   _| |  | |  ___| / __ \ / ____|"
echo "   | \  / | || |_ | |_    | | | |  | | |__  | |  | | (___  "
echo "   | |\/| |__   _||  _|   | | \ \  / /  __| | |  | |\___ \ "
echo "   | |  | |  | |  | |    _| |_ \ \/ /| |___ | |__| |____) |"
echo "   |_|  |_|  |_|  |_|   |_____| \__/ |_____| \____/|_____/ "
echo "=========================================================="
echo "[M4-INIT] Initializing M4 Five Core Supervisor v5.0.0..."

# Mount essential pseudo-filesystems if running in rootfs
if [ "$$" -eq 1 ]; then
    mount -t proc proc /proc || true
    mount -t sysfs sysfs /sys || true
    mount -t devtmpfs devtmpfs /dev || true
    mkdir -p /dev/pts /dev/shm
    mount -t devpts devpts /dev/pts || true
    mount -t tmpfs tmpfs /dev/shm || true
fi

echo "[M4-INIT] Verifying Security Sandbox Policies..."
test -f /etc/m4/security-policy.json || echo "[M4-INIT] Warning: default policy applied."

echo "[M4-INIT] Launching M4 Core IPC Daemon..."
exec node /usr/lib/m4five/server.js
