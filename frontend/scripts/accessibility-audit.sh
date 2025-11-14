#!/bin/bash
# Accessibility Audit Script
# Run: bash frontend/scripts/accessibility-audit.sh

echo "=== Accessibility Audit ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Lighthouse is installed
if ! command -v lighthouse &> /dev/null; then
    echo -e "${YELLOW}⚠ Lighthouse not found. Installing...${NC}"
    npm install -g lighthouse
fi

BASE_URL="http://localhost:5173"
OUTPUT_DIR="./accessibility-reports"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Pages to audit
PAGES=(
    "/login"
    "/"
    "/orders"
    "/products"
    "/settings"
)

echo "Running Lighthouse accessibility audits..."
echo ""

for page in "${PAGES[@]}"; do
    echo "Auditing: $page"
    PAGE_NAME=$(echo "$page" | sed 's/\//-/g' | sed 's/^-//')
    
    lighthouse "$BASE_URL$page" \
        --only-categories=accessibility \
        --output=html \
        --output-path="$OUTPUT_DIR/lighthouse-a11y-$PAGE_NAME.html" \
        --chrome-flags="--headless" \
        --quiet
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Audit completed: $page${NC}"
    else
        echo -e "${RED}✗ Audit failed: $page${NC}"
    fi
done

echo ""
echo "=== Accessibility Audit Summary ==="
echo "Reports saved to: $OUTPUT_DIR"
echo ""
echo "To view reports, open:"
for page in "${PAGES[@]}"; do
    PAGE_NAME=$(echo "$page" | sed 's/\//-/g' | sed 's/^-//')
    echo "  - $OUTPUT_DIR/lighthouse-a11y-$PAGE_NAME.html"
done

