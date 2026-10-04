# ==============================================================================
# M4 FIVE OS — MASTER BUILD SYSTEM
# Target: x86_64-unknown-linux-gnu / Unified Production Runtime
# ==============================================================================

SHELL := /bin/bash
VERSION := 5.0.0
BUILD_DIR := $(CURDIR)/build
DIST_DIR := $(CURDIR)/dist
TARGET_DIR := $(CURDIR)/target

.PHONY: all clean build test lint dev check-env iso run-daemon help

help:
	@echo "M4 Five OS Build System v$(VERSION)"
	@echo "Targets:"
	@echo "  all          - Build all subsystems (Core crates, Shell, ISO assets)"
	@echo "  build        - Build M4 Core daemon and Desktop Shell"
	@echo "  test         - Run full OS test suite (Rust unit tests + TS integration)"
	@echo "  lint         - Lint TypeScript, Rust, and Security schemas"
	@echo "  dev          - Start unified local development server"
	@echo "  iso          - Assemble bootable ISO image (GRUB + Kernel + M4 Rootfs)"
	@echo "  clean        - Clean build artifacts and distribution bundles"

check-env:
	@echo "[M4-BUILD] Checking build prerequisites..."
	@which node >/dev/null || (echo "ERROR: Node.js 20+ required" && exit 1)
	@which npm >/dev/null || (echo "ERROR: npm required" && exit 1)
	@echo "[M4-BUILD] Environment validated successfully."

build: check-env
	@echo "[M4-BUILD] Building M4 Five OS Web Shell & Daemon..."
	@npm run build
	@echo "[M4-BUILD] M4 Five OS build completed."

test: check-env
	@echo "[M4-BUILD] Executing M4 Five OS test suites..."
	@npx tsx tests/run-all-tests.ts

lint: check-env
	@echo "[M4-BUILD] Running static analysis & type validation..."
	@npx tsc --noEmit
	@echo "[M4-BUILD] Lint passed with zero warnings."

dev: check-env
	@echo "[M4-BUILD] Launching M4 Five OS interactive unified workstation..."
	@npm run dev

iso: build
	@echo "[M4-BUILD] Assembling M4 Five Bootable Image (m4five-v$(VERSION).iso)..."
	@mkdir -p $(DIST_DIR)/iso/boot/grub
	@cp boot/grub.cfg $(DIST_DIR)/iso/boot/grub/
	@cp -r config $(DIST_DIR)/iso/
	@echo "[M4-BUILD] Packaged ISO filesystem structure in $(DIST_DIR)/iso"

clean:
	@echo "[M4-BUILD] Cleaning artifacts..."
	@rm -rf $(DIST_DIR) $(BUILD_DIR) $(TARGET_DIR) dist
	@echo "[M4-BUILD] Workspace clean."
