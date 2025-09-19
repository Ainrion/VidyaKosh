#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Vidyakosh Development Servers...${NC}"
echo -e "${YELLOW}📋 Loading environment variables from .env.local${NC}"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local file not found!${NC}"
    echo -e "${YELLOW}Please create .env.local with your Supabase configuration.${NC}"
    exit 1
fi

# Load environment variables
export $(cat .env.local | xargs)

echo -e "${GREEN}✅ Environment variables loaded${NC}"
echo -e "${BLUE}🔧 Starting Socket.IO Server (port 3001) and Next.js (port 3000)...${NC}"

# Start both servers with concurrently
npx concurrently \
  --names "SOCKET,NEXT" \
  --prefix-colors "blue,green" \
  --prefix "[{name}]" \
  --kill-others \
  "node server.js" \
  "npx next dev --port 3000"

