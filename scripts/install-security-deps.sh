#!/bin/bash

# Thanalytica Security Dependencies Installation Script
# This script installs all required security packages for HIPAA compliance

echo "🔒 Installing Thanalytica Security Dependencies"
echo "=============================================="

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed or not in PATH"
    echo "Please install Node.js and npm first:"
    echo "  - Visit: https://nodejs.org/"
    echo "  - Or use nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    exit 1
fi

echo "📦 Installing production security dependencies..."

# Install security packages
npm install \
  cors@^2.8.5 \
  helmet@^8.1.0 \
  express-rate-limit@^7.5.1 \
  ioredis@^5.7.0

if [ $? -ne 0 ]; then
    echo "❌ Failed to install production dependencies"
    exit 1
fi

echo "🔧 Installing development type definitions..."

# Install type definitions
npm install --save-dev @types/cors@^2.8.19

if [ $? -ne 0 ]; then
    echo "❌ Failed to install development dependencies"
    exit 1
fi

echo "✅ Security dependencies installed successfully!"
echo ""
echo "📋 Installed packages:"
echo "  - cors@^2.8.5 (CORS protection)"
echo "  - helmet@^8.1.0 (Security headers)"
echo "  - express-rate-limit@^7.5.1 (Rate limiting)"
echo "  - ioredis@^5.7.0 (Redis client for distributed rate limiting)"
echo "  - @types/cors@^2.8.19 (TypeScript definitions)"
echo ""
echo "🔒 Next steps:"
echo "1. Generate security keys: node scripts/generate-security-keys.js"
echo "2. Configure environment: cp .env.template .env && vim .env"
echo "3. Test security: npm run build && npm start"
echo "4. Deploy securely: npm run firebase:deploy"
echo ""
echo "⚠️  Important: Your application now has enterprise-grade security!"
echo "   Review SECURITY_DEPLOYMENT_CHECKLIST.md before deployment."