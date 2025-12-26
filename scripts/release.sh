#!/bin/bash
set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: pnpm release <version>"
  echo "Example: pnpm release 1.0.0"
  exit 1
fi

# Validate semver format
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: Version must be in semver format (e.g., 1.0.0)"
  exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: Working directory has uncommitted changes"
  exit 1
fi

# Update manifest.json
jq --arg version "$VERSION" '.version = $version' manifest.json > temp.json && mv temp.json manifest.json

# Commit and tag
git add manifest.json
git commit -m "chore: release v$VERSION"
git tag "$VERSION"

echo ""
echo "Created release v$VERSION"
echo "Run the following to publish:"
echo "  git push origin main && git push origin $VERSION"
