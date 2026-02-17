#!/bin/bash
# Deployment Verification Script
# This script verifies the build output before deployment

set -e

echo "🔍 DEPLOYMENT VERIFICATION"
echo "=========================="

# Check if out directory exists
if [ ! -d "out" ]; then
  echo "❌ ERROR: out/ directory not found!"
  exit 1
fi
echo "✓ out/ directory exists"

# Check for index.html
if [ ! -f "out/index.html" ]; then
  echo "❌ ERROR: out/index.html not found!"
  ls -la out/
  exit 1
fi
echo "✓ index.html exists"

# Check for _next directory
if [ ! -d "out/_next" ]; then
  echo "❌ ERROR: out/_next directory not found!"
  ls -la out/
  exit 1
fi
echo "✓ _next/ directory exists"

# Verify basePath in HTML
if ! grep -q '/insightboard/_next' out/index.html; then
  echo "⚠️  WARNING: basePath might not be set correctly in HTML"
  grep -o 'href="[^"]*"' out/index.html | head -3
else
  echo "✓ basePath correctly set in HTML"
fi

# Count files
FILE_COUNT=$(find out -type f | wc -l)
echo "✓ Total files generated: $FILE_COUNT"

# Check critical directories
for dir in "dashboard" "onboarding" "dashboard-template"; do
  if [ -d "out/$dir" ]; then
    echo "✓ $dir/ directory exists"
  else
    echo "⚠️  WARNING: $dir/ directory not found"
  fi
done

echo ""
echo "✅ BUILD VERIFICATION COMPLETE"
echo "=============================="
