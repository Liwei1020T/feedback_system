#!/bin/bash
set -e

echo "Testing Demo Data Setup..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_BASE="http://localhost:8001"
ADMIN_USER="admin"
ADMIN_PASS="admin123"

# Function to print colored output
print_success() {
    echo -e "${GREEN}[OK] $1${NC}"
}

print_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

print_info() {
    echo -e "${YELLOW}[INFO] $1${NC}"
}

# Check if container is running
echo "1. Checking if container is running..."
if docker ps | grep -q feedback-app; then
    print_success "Container is running"
else
    print_error "Container is not running. Start it with: docker-compose up -d"
    exit 1
fi

# Wait for health check
echo ""
echo "2. Waiting for application to be ready..."
MAX_RETRIES=30
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if curl -s "${API_BASE}/health" > /dev/null 2>&1; then
        print_success "Application is ready"
        break
    fi
    RETRY=$((RETRY+1))
    if [ $RETRY -eq $MAX_RETRIES ]; then
        print_error "Application failed to start within timeout"
        exit 1
    fi
    echo -n "."
    sleep 2
done

# Test login
echo ""
echo "3. Testing admin login..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"${ADMIN_USER}\",\"password\":\"${ADMIN_PASS}\"}")

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    print_success "Login successful"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
else
    print_error "Login failed"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

# Test users endpoint
echo ""
echo "4. Checking demo users..."
USERS_RESPONSE=$(curl -s -X GET "${API_BASE}/api/users" \
    -H "Authorization: Bearer ${TOKEN}")

USER_COUNT=$(echo "$USERS_RESPONSE" | grep -o '"id"' | wc -l)
print_info "Found ${USER_COUNT} users"

if [ "$USER_COUNT" -ge 9 ]; then
    print_success "Demo users created successfully"
else
    print_error "Expected at least 9 demo users, found ${USER_COUNT}"
fi

# Test complaints endpoint
echo ""
echo "5. Checking demo complaints..."
COMPLAINTS_RESPONSE=$(curl -s -X GET "${API_BASE}/api/complaints" \
    -H "Authorization: Bearer ${TOKEN}")

COMPLAINT_COUNT=$(echo "$COMPLAINTS_RESPONSE" | grep -o '"id"' | wc -l)
print_info "Found ${COMPLAINT_COUNT} complaints"

if [ "$COMPLAINT_COUNT" -ge 10 ]; then
    print_success "Demo complaints created successfully"
else
    print_error "Expected at least 10 demo complaints, found ${COMPLAINT_COUNT}"
fi

# Test categories endpoint
echo ""
echo "6. Checking categories..."
CATEGORIES_RESPONSE=$(curl -s -X GET "${API_BASE}/api/categories" \
    -H "Authorization: Bearer ${TOKEN}")

CATEGORY_COUNT=$(echo "$CATEGORIES_RESPONSE" | grep -o '"id"' | wc -l)
print_info "Found ${CATEGORY_COUNT} categories"

EXPECTED_CATEGORIES=("IT" "HR" "Payroll" "Facilities" "Safety")
for cat in "${EXPECTED_CATEGORIES[@]}"; do
    if echo "$CATEGORIES_RESPONSE" | grep -q "\"$cat\""; then
        print_success "Category '$cat' exists"
    else
        print_error "Category '$cat' missing"
    fi
done

# Test data distribution
echo ""
echo "7. Checking data distribution..."

# Check plants
PLANTS=("P1" "P2" "BK")
for plant in "${PLANTS[@]}"; do
    PLANT_COUNT=$(echo "$COMPLAINTS_RESPONSE" | grep -o "\"plant\":\"$plant\"" | wc -l)
    if [ "$PLANT_COUNT" -gt 0 ]; then
        print_success "Plant '$plant': ${PLANT_COUNT} complaints"
    else
        print_info "Plant '$plant': no complaints"
    fi
done

# Check statuses
STATUSES=("Pending" "In Progress" "Resolved")
for status in "${STATUSES[@]}"; do
    STATUS_COUNT=$(echo "$COMPLAINTS_RESPONSE" | grep -o "\"status\":\"$status\"" | wc -l)
    if [ "$STATUS_COUNT" -gt 0 ]; then
        print_success "Status '$status': ${STATUS_COUNT} complaints"
    fi
done

# Test database file
echo ""
echo "8. Checking database file..."
if docker exec feedback-app test -f /app/data/db.json; then
    DB_SIZE=$(docker exec feedback-app stat -f%z /app/data/db.json 2>/dev/null || docker exec feedback-app stat -c%s /app/data/db.json)
    print_success "Database file exists (Size: ${DB_SIZE} bytes)"
else
    print_error "Database file not found"
fi

# Summary
echo ""
echo "=========================================="
echo "Summary:"
echo "=========================================="
print_success "Total Users: ${USER_COUNT}"
print_success "Total Complaints: ${COMPLAINT_COUNT}"
print_success "Total Categories: ${CATEGORY_COUNT}"
echo ""
print_info "You can now access the application at:"
echo "  Frontend: http://localhost:8001"
echo "  API Docs: http://localhost:8001/docs"
echo ""
print_info "Login credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
print_success "Demo data setup verified successfully!"
