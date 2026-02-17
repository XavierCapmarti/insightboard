# GitHub Pages Deployment Setup

## Required Configuration

For this workflow to deploy successfully, you need to configure the `github-pages` environment in your repository settings.

### Steps to Fix Environment Protection Rules:

1. Go to: `https://github.com/XavierCapmarti/insightboard/settings/environments`
2. Click on `github-pages` environment (or create it if it doesn't exist)
3. Under **Deployment branches**, select:
   - **All branches** OR
   - **Selected branches** and add `main` to the allowed list
4. Save the configuration

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
