#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== ascist Production Deploy ===${NC}"

cd "$(dirname "$0")"

echo -e "${YELLOW}Installing frontend dependencies...${NC}"
cd front && pnpm install && cd ..

echo -e "${YELLOW}Deploying to Firebase...${NC}"
firebase deploy --only hosting

echo -e "${GREEN}=== Deploy complete! ===${NC}"
