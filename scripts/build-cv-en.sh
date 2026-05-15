#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"
weasyprint "$SCRIPT_DIR/cv-en.html" "$ROOT/public/ed-dubnitsky-cv-en.pdf"
echo "Built $ROOT/public/ed-dubnitsky-cv-en.pdf"
