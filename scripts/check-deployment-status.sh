#!/bin/bash
# Check deployment status and track failures

echo "🔍 DEPLOYMENT STATUS CHECKER"
echo "============================="
echo ""

# Check local build
echo "1. LOCAL BUILD TEST:"
if [ -d "out" ] && [ -f "out/index.html" ]; then
  echo "   ✓ Build output exists locally"
else
  echo "   ✗ No local build - running test build..."
  rm -rf src/app/api src/__tests__ .next out
  GITHUB_PAGES='true' NODE_ENV='production' npm run build > /dev/null 2>&1
  if [ -f "out/index.html" ]; then
    echo "   ✓ Test build successful"
  else
    echo "   ✗ Test build FAILED"
    exit 1
  fi
fi

echo ""
echo "2. SITE ACCESSIBILITY:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://xaviercapmarti.github.io/insightboard/)
if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✓ Site is live (HTTP $HTTP_CODE)"
else
  echo "   ✗ Site returned HTTP $HTTP_CODE"
fi

echo ""
echo "3. WORKFLOW FILE:"
if [ -f ".github/workflows/deploy.yml" ]; then
  echo "   ✓ Workflow file exists"
  STEPS=$(grep -c "name:" .github/workflows/deploy.yml)
  echo "   ✓ Found $STEPS steps in workflow"
else
  echo "   ✗ Workflow file missing!"
  exit 1
fi

echo ""
echo "4. NEXT.JS CONFIG:"
if grep -q "basePath.*insightboard" next.config.js; then
  echo "   ✓ basePath configured correctly"
else
  echo "   ✗ basePath might be missing"
fi

echo ""
echo "✅ STATUS CHECK COMPLETE"
echo "========================"
echo ""
echo "Check GitHub Actions: https://github.com/XavierCapmarti/insightboard/actions"
echo "Site URL: https://xaviercapmarti.github.io/insightboard/"
