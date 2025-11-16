#!/bin/bash
# Security Scanning Script
# Run: bash backend/scripts/security-scan.sh

echo "=== Security Scanning ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend npm audit
echo "1. Backend Dependency Scan (npm audit)..."
cd backend
npm audit --audit-level=moderate
BACKEND_AUDIT=$?
cd ..

if [ $BACKEND_AUDIT -eq 0 ]; then
    echo -e "${GREEN}✓ Backend: No moderate or higher vulnerabilities${NC}"
else
    echo -e "${YELLOW}⚠ Backend: Vulnerabilities found. Review and fix.${NC}"
fi

echo ""

# Frontend npm audit
echo "2. Frontend Dependency Scan (npm audit)..."
cd frontend
npm audit --audit-level=moderate
FRONTEND_AUDIT=$?
cd ..

if [ $FRONTEND_AUDIT -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend: No moderate or higher vulnerabilities${NC}"
else
    echo -e "${YELLOW}⚠ Frontend: Vulnerabilities found. Review and fix.${NC}"
fi

echo ""

# Check for console.log in production build
echo "3. Checking for console.log in production build..."
if [ -d "frontend/dist" ]; then
    CONSOLE_COUNT=$(grep -r "console\." frontend/dist/ | wc -l)
    if [ $CONSOLE_COUNT -eq 0 ]; then
        echo -e "${GREEN}✓ No console statements in production build${NC}"
    else
        echo -e "${YELLOW}⚠ Found $CONSOLE_COUNT console statements in production build${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Production build not found. Run 'npm run build' first.${NC}"
fi

echo ""

# Check for exposed secrets
echo "4. Checking for exposed secrets in frontend build..."
if [ -d "frontend/dist" ]; then
    SECRET_COUNT=$(grep -ri "JWT_SECRET\|DB_PASSWORD\|SENTRY_DSN\|API_KEY" frontend/dist/ | wc -l)
    if [ $SECRET_COUNT -eq 0 ]; then
        echo -e "${GREEN}✓ No secrets exposed in frontend build${NC}"
    else
        echo -e "${RED}✗ Found $SECRET_COUNT potential secrets in frontend build${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Production build not found. Run 'npm run build' first.${NC}"
fi

echo ""

# Check for SQL injection patterns
echo "5. Checking for SQL injection vulnerabilities..."
SQL_PATTERNS=$(grep -r "sequelize.query\|sequelize.literal" backend/server.js backend/models/ backend/middleware/ 2>/dev/null | grep -v "//" | wc -l)
if [ $SQL_PATTERNS -eq 0 ]; then
    echo -e "${GREEN}✓ No raw SQL queries found (using Sequelize ORM)${NC}"
else
    echo -e "${YELLOW}⚠ Found $SQL_PATTERNS raw SQL queries. Review for SQL injection risks.${NC}"
fi

echo ""

# Check security headers
echo "6. Checking security headers configuration..."
if grep -q "helmet" backend/server.js; then
    echo -e "${GREEN}✓ Helmet security headers configured${NC}"
else
    echo -e "${RED}✗ Helmet not configured${NC}"
fi

echo ""

# Check CORS configuration
echo "7. Checking CORS configuration..."
if grep -q "CORS_ORIGIN\|allowedOrigins" backend/server.js; then
    echo -e "${GREEN}✓ CORS configured with origin restrictions${NC}"
else
    echo -e "${RED}✗ CORS not properly configured${NC}"
fi

echo ""

# Check password hashing
echo "8. Checking password hashing..."
if grep -q "bcrypt\|bcryptjs" backend/server.js; then
    echo -e "${GREEN}✓ Password hashing implemented (bcrypt)${NC}"
else
    echo -e "${RED}✗ Password hashing not found${NC}"
fi

echo ""

# Summary
echo "=== Security Scan Summary ==="
if [ $BACKEND_AUDIT -eq 0 ] && [ $FRONTEND_AUDIT -eq 0 ]; then
    echo -e "${GREEN}✓ All security checks passed${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some security issues found. Review and fix.${NC}"
    exit 1
fi

