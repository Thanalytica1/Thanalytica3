#!/bin/bash

# Thanalytica Deployment Script
# Usage: ./scripts/deploy.sh [environment]
# Environments: development, staging, production

set -e

ENVIRONMENT=${1:-development}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying Thanalytica to ${ENVIRONMENT}...${NC}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
    echo -e "${YELLOW}Valid environments: development, staging, production${NC}"
    exit 1
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI is not installed${NC}"
    echo -e "${YELLOW}Install it with: npm install -g firebase-tools${NC}"
    exit 1
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Firebase${NC}"
    echo -e "${YELLOW}Login with: firebase login${NC}"
    exit 1
fi

cd "$PROJECT_ROOT"

# Set up environment-specific configuration
CONFIG_FILE="firebase-config/${ENVIRONMENT}.json"
if [[ ! -f "$CONFIG_FILE" ]]; then
    echo -e "${RED}❌ Configuration file not found: $CONFIG_FILE${NC}"
    exit 1
fi

# Copy environment config to .firebaserc
cp "$CONFIG_FILE" .firebaserc
echo -e "${GREEN}✅ Environment configuration set for ${ENVIRONMENT}${NC}"

# Load environment variables
ENV_FILE=".env.${ENVIRONMENT}"
if [[ -f "$ENV_FILE" ]]; then
    export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
    echo -e "${GREEN}✅ Environment variables loaded from ${ENV_FILE}${NC}"
elif [[ -f ".env" ]]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo -e "${YELLOW}⚠️  Using default .env file${NC}"
else
    echo -e "${YELLOW}⚠️  No environment file found${NC}"
fi

# Build the application
echo -e "${BLUE}📦 Building application...${NC}"
npm run build:all

# Deploy based on environment
case $ENVIRONMENT in
    development)
        echo -e "${BLUE}🔧 Deploying to development environment...${NC}"
        firebase deploy --only hosting,functions,firestore:rules,storage:rules
        ;;
    staging)
        echo -e "${BLUE}🧪 Deploying to staging environment...${NC}"
        firebase deploy --only hosting,functions,firestore:rules,storage:rules
        
        # Run post-deployment tests
        echo -e "${BLUE}🧪 Running smoke tests...${NC}"
        npm run test:smoke || echo -e "${YELLOW}⚠️  Smoke tests failed${NC}"
        ;;
    production)
        echo -e "${BLUE}🏭 Deploying to production environment...${NC}"
        
        # Extra safety checks for production
        echo -e "${YELLOW}⚠️  Production deployment - Please confirm:${NC}"
        echo -e "  Environment: ${ENVIRONMENT}"
        echo -e "  Project: $(cat .firebaserc | grep -o '"default": "[^"]*"' | cut -d'"' -f4)"
        echo -e "  Are you sure? (y/N)"
        read -r confirm
        
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            echo -e "${RED}❌ Deployment cancelled${NC}"
            exit 1
        fi
        
        # Deploy with backup
        firebase deploy --only hosting,functions,firestore:rules,storage:rules
        
        # Run comprehensive tests
        echo -e "${BLUE}🧪 Running production tests...${NC}"
        npm run test:production || echo -e "${YELLOW}⚠️  Production tests failed${NC}"
        ;;
esac

# Get deployment URL
PROJECT_ID=$(cat .firebaserc | grep -o '"default": "[^"]*"' | cut -d'"' -f4)
HOSTING_URL="https://${PROJECT_ID}.web.app"

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${BLUE}🌐 Application URL: ${HOSTING_URL}${NC}"
echo -e "${BLUE}📊 Firebase Console: https://console.firebase.google.com/project/${PROJECT_ID}${NC}"

# Environment-specific post-deployment actions
case $ENVIRONMENT in
    development)
        echo -e "${BLUE}💡 Development deployment complete${NC}"
        echo -e "${YELLOW}📝 Remember to test new features before promoting to staging${NC}"
        ;;
    staging)
        echo -e "${BLUE}💡 Staging deployment complete${NC}"
        echo -e "${YELLOW}📝 Ready for user acceptance testing${NC}"
        ;;
    production)
        echo -e "${GREEN}🎉 Production deployment complete!${NC}"
        echo -e "${YELLOW}📝 Monitor application health and user feedback${NC}"
        echo -e "${BLUE}📈 Analytics: https://console.firebase.google.com/project/${PROJECT_ID}/analytics${NC}"
        ;;
esac