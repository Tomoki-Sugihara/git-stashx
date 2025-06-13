# Makefile for git-backup

VERSION := 1.0.0
BINARY_NAME := git-backup
INSTALL_DIR := /usr/local/bin

# Build targets for different platforms
.PHONY: all build-macos build-linux install uninstall clean

all: build-macos

# macOS (Intel and Apple Silicon)
build-macos:
	@echo "Building for macOS..."
	deno compile --allow-run --allow-read --allow-write \
		--output $(BINARY_NAME) \
		--target x86_64-apple-darwin \
		mod.ts
	deno compile --allow-run --allow-read --allow-write \
		--output $(BINARY_NAME)-arm64 \
		--target aarch64-apple-darwin \
		mod.ts
	@echo "Build complete!"

# Linux (x86_64)
build-linux:
	@echo "Building for Linux..."
	deno compile --allow-run --allow-read --allow-write \
		--output $(BINARY_NAME)-linux \
		--target x86_64-unknown-linux-gnu \
		mod.ts
	@echo "Build complete!"

# Install locally (for testing)
install: build-macos
	@echo "Installing $(BINARY_NAME) to $(INSTALL_DIR)..."
	@cp $(BINARY_NAME) $(INSTALL_DIR)/
	@chmod +x $(INSTALL_DIR)/$(BINARY_NAME)
	@echo "Installation complete!"

# Uninstall
uninstall:
	@echo "Removing $(BINARY_NAME) from $(INSTALL_DIR)..."
	@rm -f $(INSTALL_DIR)/$(BINARY_NAME)
	@echo "Uninstallation complete!"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -f $(BINARY_NAME) $(BINARY_NAME)-arm64 $(BINARY_NAME)-linux
	@echo "Clean complete!"

# Create a release tarball
release: clean build-macos
	@echo "Creating release tarball..."
	@mkdir -p dist
	@tar -czf dist/$(BINARY_NAME)-$(VERSION)-macos.tar.gz $(BINARY_NAME) $(BINARY_NAME)-arm64 LICENSE README.md
	@echo "Release tarball created: dist/$(BINARY_NAME)-$(VERSION)-macos.tar.gz"