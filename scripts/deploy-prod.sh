#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Expected production project ID
EXPECTED_PROJECT="ascist-87337"

echo -e "${GREEN}=== ascist Production Deploy ===${NC}"

# Navigate to project root
cd "$(dirname "$0")/.."

# Safety guard: Check if connected to the correct Firebase project
CURRENT_PROJECT=$(firebase use 2>/dev/null | grep -oP '(?<=Active Project: )\S+' || true)

if [ -z "$CURRENT_PROJECT" ]; then
  # Try alternative method
  CURRENT_PROJECT=$(firebase projects:list 2>/dev/null | grep "(current)" | awk '{print $2}' || true)
fi

if [ "$CURRENT_PROJECT" != "$EXPECTED_PROJECT" ]; then
  echo -e "${RED}ERROR: Not connected to production project!${NC}"
  echo -e "Expected: ${GREEN}${EXPECTED_PROJECT}${NC}"
  echo -e "Current:  ${RED}${CURRENT_PROJECT:-'unknown'}${NC}"
  echo ""
  echo "To fix, run: firebase use ${EXPECTED_PROJECT}"
  exit 1
fi

echo -e "${GREEN}Verified Firebase project: ${EXPECTED_PROJECT}${NC}"

echo -e "${YELLOW}Installing frontend dependencies...${NC}"
cd front && pnpm install && cd ..

echo -e "${YELLOW}Deploying to Firebase...${NC}"
firebase deploy --only hosting

echo -e "${GREEN}=== Deploy complete! ===${NC}"
