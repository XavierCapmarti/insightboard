# GitHub Pages Deployment Setup

## ⚠️ CRITICAL: Environment Configuration Required

**The workflow WILL FAIL until you configure the environment.** This is a GitHub requirement.

### Quick Fix (5 minutes):

1. **Go to repository settings:**
   ```
   https://github.com/XavierCapmarti/insightboard/settings/environments
   ```

2. **Create or edit `github-pages` environment:**
   - If it doesn't exist: Click "New environment" → Name it `github-pages`
   - If it exists: Click on `github-pages`

3. **Configure deployment branches:**
   - Under "Deployment branches"
   - Select **"All branches"** (easiest)
   - OR select **"Selected branches"** and add `main`
   - Click **"Save protection rules"**

4. **Verify:**
   - Go to Actions: `https://github.com/XavierCapmarti/insightboard/actions`
   - Re-run the failed workflow or push a new commit
   - It should now deploy successfully

### Alternative: Use the helper script

Run: `./scripts/fix-github-pages-env.sh` for step-by-step instructions.

### Alternative: Remove Protection Rules

If you want to allow all branches:
1. Go to environment settings
2. Remove any branch protection rules
3. Save

## Workflow Structure

The workflow has two jobs:
- **build**: Builds the static site and uploads artifact
- **deploy**: Deploys the artifact to GitHub Pages (requires environment)

## Troubleshooting

If you see "Branch main is not allowed" error:
- The environment has protection rules blocking main branch
- Follow the steps above to allow main branch

If you see "Missing environment" error:
- The environment doesn't exist
- Create it in repository settings → Environments
