# 🔒 Security Dependencies Installation Guide

## Issue Resolution
You're seeing missing security dependencies because the package.json has been updated with critical security packages, but they haven't been installed yet.

## ✅ SOLUTION: Install Security Dependencies

### Option 1: Automated Installation (Recommended)
```bash
# Run the automated security setup
npm run security:setup
```

This will:
1. Install all security dependencies
2. Generate encryption keys
3. Create .env template

### Option 2: Manual Installation
```bash
# Install production security packages
npm install cors@^2.8.5 helmet@^8.1.0 express-rate-limit@^7.5.1 ioredis@^5.7.0

# Install development type definitions
npm install --save-dev @types/cors@^2.8.19
```

### Option 3: Script Installation
```bash
# Run the installation script directly
./scripts/install-security-deps.sh
```

---

## 📦 Security Packages Being Installed

| Package | Version | Purpose |
|---------|---------|---------|
| `cors` | ^2.8.5 | Cross-Origin Resource Sharing protection |
| `helmet` | ^8.1.0 | Security headers (CSP, HSTS, etc.) |
| `express-rate-limit` | ^7.5.1 | Rate limiting for DoS protection |
| `ioredis` | ^5.7.0 | Redis client for distributed rate limiting |
| `@types/cors` | ^2.8.19 | TypeScript definitions for CORS |

---

## 🔍 Why These Dependencies Are Critical

### 1. **CORS Protection** (`cors@^2.8.5`)
- Prevents cross-site request forgery
- Essential for health data API security
- Configured with strict policies for PHI endpoints

### 2. **Security Headers** (`helmet@^8.1.0`)
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options, X-XSS-Protection
- Required for HIPAA compliance

### 3. **Rate Limiting** (`express-rate-limit@^7.5.1`)
- Prevents DoS attacks on health data endpoints
- Implements tiered limits:
  - Health data: 100 requests/hour
  - OAuth: 10 requests/minute
  - General: 500 requests/hour

### 4. **Redis Client** (`ioredis@^5.7.0`)
- Distributed rate limiting across instances
- Session storage for scalability
- Falls back to memory store if Redis unavailable

---

## 🚀 After Installation

### 1. Generate Security Keys
```bash
npm run security:keys
```

### 2. Configure Environment
```bash
cp .env.template .env
# Edit .env with your actual values
```

### 3. Verify Installation
```bash
npm run build
npm start
```

### 4. Test Security Features
```bash
# Test rate limiting
curl -X GET http://localhost:5000/api/health-assessment/test-user

# Test CORS headers
curl -H "Origin: https://malicious-site.com" http://localhost:5000/api/health-assessment/test-user

# Test authentication
curl -X GET http://localhost:5000/api/health-assessment/test-user
```

---

## 🔧 Troubleshooting

### If npm install fails:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### If script permission denied:
```bash
chmod +x scripts/install-security-deps.sh
chmod +x scripts/generate-security-keys.js
```

### If TypeScript errors:
```bash
# Install all type definitions
npm install --save-dev @types/cors @types/helmet @types/express-rate-limit
```

---

## 📋 Verification Checklist

After installation, verify:
- [ ] `package-lock.json` updated with new dependencies
- [ ] No TypeScript compilation errors
- [ ] Security middleware imports working
- [ ] Rate limiting functional
- [ ] CORS headers present
- [ ] Helmet security headers applied

---

## 🚨 Important Notes

1. **Production Deployment**: These dependencies are **required** for production deployment
2. **HIPAA Compliance**: Without these packages, your application is **not HIPAA compliant**
3. **Security**: These packages protect against common web vulnerabilities
4. **Performance**: Redis is optional but recommended for distributed rate limiting

---

## 🆘 Need Help?

If you encounter issues:
1. Check Node.js version: `node --version` (requires 18+)
2. Check npm version: `npm --version` (requires 8+)
3. Review `SECURITY_DEPLOYMENT_CHECKLIST.md`
4. Contact your development team

**Remember: These security dependencies are critical for protecting patient health data!**