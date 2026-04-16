#!/bin/bash
# ============================================================================
# StoresGo Marketplace - Comprehensive Audit Script (v2 - Fixed)
# Stack: Node.js/Fastify | Next.js | PostgreSQL | Oracle Cloud Infrastructure
# Purpose: Marketplace Compliance + Google Page 1 Readiness + Core Web Vitals
#
# Fixes from v1:
#   - TTFB: Uses curl time_starttransfer (median of 3) instead of total download
#   - Compression: Sends Accept-Encoding header so server responds with encoding
#   - Nginx: Uses sudo nginx -t and captures stderr
#   - UFW: Uses sudo ufw status
#   - Sitemap: Counts URLs across sub-sitemaps for sitemap indexes
#   - DB: Uses sudo -u postgres, correct column names (priceCents, imageUrl)
#   - PM2: Checks actual crash loops (uptime < 60s) not cumulative restarts
#   - Product schema: Queries DB for product slug instead of parsing HTML
#   - next/image: Checks source code, not just rendered HTML
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0
SKIP_COUNT=0

SITE_URL="${STORESGO_URL:-https://storesgo.com}"
DB_NAME="${PGDATABASE:-storesgo}"

pass()  { echo -e "  ${GREEN}[PASS]${NC} $1"; ((PASS_COUNT++)); }
fail()  { echo -e "  ${RED}[FAIL]${NC} $1"; ((FAIL_COUNT++)); }
warn()  { echo -e "  ${YELLOW}[WARN]${NC} $1"; ((WARN_COUNT++)); }
skip()  { echo -e "  ${CYAN}[SKIP]${NC} $1"; ((SKIP_COUNT++)); }
header(){ echo -e "\n${BOLD}${YELLOW}[$1] $2${NC}"; }

echo -e "${BOLD}${YELLOW}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║       StoresGo Marketplace - Comprehensive Audit v2         ║"
echo "║       $(date '+%Y-%m-%d %H:%M:%S %Z')                       "
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  Target: ${CYAN}${SITE_URL}${NC}"
echo -e "  Database: ${CYAN}${DB_NAME}${NC}"

# ============================================================================
# SECTION 1: SERVER & RUNTIME ENVIRONMENT
# ============================================================================
header "1/8" "Server & Runtime Environment"

if command -v node &> /dev/null; then
    NODE_VER=$(node -v | tr -d 'v')
    NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
    if [ "$NODE_MAJOR" -ge 18 ]; then
        pass "Node.js v${NODE_VER} (LTS supported)"
    else
        fail "Node.js v${NODE_VER} — upgrade to v18+ LTS for security & performance"
    fi
else
    fail "Node.js not found in PATH"
fi

if command -v npm &> /dev/null; then
    pass "npm $(npm -v) available"
else
    warn "npm not found"
fi

if command -v pm2 &> /dev/null; then
    PM2_PROCS=$(pm2 jlist 2>/dev/null | python3 -c "import sys,json; data=json.load(sys.stdin); print(len(data))" 2>/dev/null || echo "0")
    if [ "$PM2_PROCS" -gt 0 ]; then
        pass "PM2 running with ${PM2_PROCS} process(es)"
        # FIX: Check for actual crash loops (uptime < 60s + high restarts), not cumulative deployment restarts
        CRASH_LOOP=$(pm2 jlist 2>/dev/null | python3 -c "
import sys,json,time
data=json.load(sys.stdin)
now_ms=int(time.time()*1000)
loops=[p for p in data if p.get('pm2_env',{}).get('restart_time',0)>10 and (now_ms - p.get('pm2_env',{}).get('pm_uptime',0))<60000]
print(len(loops))
" 2>/dev/null || echo "0")
        if [ "$CRASH_LOOP" -gt 0 ]; then
            fail "${CRASH_LOOP} process(es) in active crash loop (restarting within 60s)"
        else
            pass "No active crash loops detected"
        fi
    else
        warn "PM2 installed but no processes running"
    fi
else
    warn "PM2 not found — recommended for production process management"
fi

TOTAL_MEM=$(free -m 2>/dev/null | awk '/Mem:/{print $2}')
AVAIL_MEM=$(free -m 2>/dev/null | awk '/Mem:/{print $7}')
if [ -n "$TOTAL_MEM" ]; then
    MEM_PERCENT=$((AVAIL_MEM * 100 / TOTAL_MEM))
    if [ "$MEM_PERCENT" -gt 20 ]; then
        pass "Memory: ${AVAIL_MEM}MB available of ${TOTAL_MEM}MB (${MEM_PERCENT}% free)"
    else
        fail "Memory pressure: only ${AVAIL_MEM}MB available of ${TOTAL_MEM}MB (${MEM_PERCENT}% free)"
    fi
fi

DISK_USE=$(df -h / 2>/dev/null | awk 'NR==2{print $5}' | tr -d '%')
if [ -n "$DISK_USE" ]; then
    if [ "$DISK_USE" -lt 80 ]; then
        pass "Disk usage: ${DISK_USE}%"
    elif [ "$DISK_USE" -lt 90 ]; then
        warn "Disk usage: ${DISK_USE}% — consider cleanup"
    else
        fail "Disk critically full: ${DISK_USE}%"
    fi
fi

# ============================================================================
# SECTION 2: SSL / HTTPS
# ============================================================================
header "2/8" "SSL & HTTPS (Google Ranking Factor)"

SSL_INFO=$(echo | openssl s_client -connect storesgo.com:443 -servername storesgo.com 2>/dev/null)
if echo "$SSL_INFO" | grep -q "Verify return code: 0"; then
    pass "SSL certificate is valid"
    EXPIRY=$(echo "$SSL_INFO" | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    if [ -n "$EXPIRY" ]; then
        EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s 2>/dev/null)
        NOW_EPOCH=$(date +%s)
        DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))
        if [ "$DAYS_LEFT" -gt 30 ]; then
            pass "SSL expires in ${DAYS_LEFT} days ($EXPIRY)"
        elif [ "$DAYS_LEFT" -gt 0 ]; then
            warn "SSL expires in ${DAYS_LEFT} days — renew soon!"
        else
            fail "SSL certificate has EXPIRED"
        fi
    fi
elif echo | openssl s_client -connect storesgo.com:443 2>/dev/null | grep -q "CONNECTED"; then
    warn "SSL connected but certificate verification failed — check chain"
else
    fail "Cannot establish SSL connection to storesgo.com:443"
fi

HTTP_REDIRECT=$(curl -o /dev/null -s -w "%{http_code}" -L --max-redirs 0 "http://storesgo.com" 2>/dev/null)
if [ "$HTTP_REDIRECT" == "301" ]; then
    pass "HTTP → HTTPS redirect (301 permanent)"
elif [ "$HTTP_REDIRECT" == "302" ]; then
    warn "HTTP → HTTPS redirect is 302 (temporary) — change to 301 for SEO"
else
    fail "No HTTP → HTTPS redirect detected (got ${HTTP_REDIRECT})"
fi

HSTS=$(curl -sI "${SITE_URL}" 2>/dev/null | grep -i "strict-transport-security")
if [ -n "$HSTS" ]; then
    pass "HSTS header present"
else
    warn "No HSTS header — add Strict-Transport-Security for security & SEO trust"
fi

# ============================================================================
# SECTION 3: GOOGLE CRAWLABILITY & INDEXING
# ============================================================================
header "3/8" "Google Crawlability & Indexing"

ROBOTS_CODE=$(curl -o /tmp/robots_audit.txt -s -w "%{http_code}" "${SITE_URL}/robots.txt" 2>/dev/null)
if [ "$ROBOTS_CODE" == "200" ]; then
    pass "robots.txt accessible (HTTP ${ROBOTS_CODE})"
    if grep -q "Disallow: /$" /tmp/robots_audit.txt 2>/dev/null; then
        fail "robots.txt contains 'Disallow: /' — this BLOCKS all Google crawling!"
    fi
    if grep -qi "sitemap" /tmp/robots_audit.txt 2>/dev/null; then
        pass "robots.txt references sitemap"
    else
        warn "robots.txt does not reference sitemap URL"
    fi
else
    fail "robots.txt not found (HTTP ${ROBOTS_CODE})"
fi

SITEMAP_CODE=$(curl -o /tmp/sitemap_audit.xml -s -w "%{http_code}" "${SITE_URL}/sitemap.xml" 2>/dev/null)
if [ "$SITEMAP_CODE" == "200" ]; then
    pass "sitemap.xml accessible"

    # FIX: Properly handle sitemap index vs flat sitemap
    if grep -q "<sitemapindex" /tmp/sitemap_audit.xml 2>/dev/null; then
        SUB_SITEMAPS=$(grep -c "<loc>" /tmp/sitemap_audit.xml 2>/dev/null || echo "0")
        pass "Sitemap index with ${SUB_SITEMAPS} sub-sitemaps"

        # Count total URLs across all sub-sitemaps
        TOTAL_SITEMAP_URLS=0
        while IFS= read -r SM_URL; do
            SM_COUNT=$(curl -s "$SM_URL" 2>/dev/null | grep -c "<loc>" 2>/dev/null || echo "0")
            TOTAL_SITEMAP_URLS=$((TOTAL_SITEMAP_URLS + SM_COUNT))
        done < <(grep -oP '<loc>\K[^<]+' /tmp/sitemap_audit.xml 2>/dev/null)

        if [ "$TOTAL_SITEMAP_URLS" -gt 0 ]; then
            pass "Total URLs across all sub-sitemaps: ${TOTAL_SITEMAP_URLS}"
        fi
    else
        URL_COUNT=$(grep -c "<loc>" /tmp/sitemap_audit.xml 2>/dev/null || echo "0")
        if [ "$URL_COUNT" -gt 0 ]; then
            pass "Sitemap contains ${URL_COUNT} URLs"
            if [ "$URL_COUNT" -lt 100 ]; then
                warn "Only ${URL_COUNT} URLs in sitemap"
            fi
        else
            warn "Sitemap appears empty or uses non-standard format"
        fi
        if [ "$URL_COUNT" -gt 50000 ]; then
            warn "Sitemap exceeds 50K URL limit — split into sitemap index"
        fi
    fi
else
    fail "sitemap.xml not accessible (HTTP ${SITEMAP_CODE})"
fi

# Homepage HTML checks
HOMEPAGE_HTML=$(curl -s "${SITE_URL}" 2>/dev/null)
if [ -n "$HOMEPAGE_HTML" ]; then
    TITLE=$(echo "$HOMEPAGE_HTML" | grep -oP '<title[^>]*>\K[^<]+' | head -1)
    if [ -n "$TITLE" ]; then
        TITLE_LEN=${#TITLE}
        if [ "$TITLE_LEN" -le 60 ]; then
            pass "Homepage title: \"${TITLE}\" (${TITLE_LEN} chars)"
        else
            warn "Homepage title is ${TITLE_LEN} chars — keep under 60 for Google SERP"
        fi
    else
        fail "No <title> tag found on homepage"
    fi

    META_DESC=$(echo "$HOMEPAGE_HTML" | grep -oP 'meta\s+name="description"\s+content="\K[^"]+' | head -1)
    if [ -z "$META_DESC" ]; then
        META_DESC=$(echo "$HOMEPAGE_HTML" | grep -oP 'meta\s+content="\K[^"]+(?="\s+name="description")' | head -1)
    fi
    if [ -n "$META_DESC" ]; then
        DESC_LEN=${#META_DESC}
        if [ "$DESC_LEN" -le 160 ]; then
            pass "Meta description present (${DESC_LEN} chars)"
        else
            warn "Meta description is ${DESC_LEN} chars — keep under 160"
        fi
    else
        fail "No meta description on homepage"
    fi

    if echo "$HOMEPAGE_HTML" | grep -q 'rel="canonical"'; then
        pass "Canonical tag present on homepage"
    else
        warn "No canonical tag on homepage"
    fi

    if echo "$HOMEPAGE_HTML" | grep -q 'property="og:'; then
        pass "Open Graph (OG) tags present"
    else
        warn "No Open Graph tags"
    fi

    if echo "$HOMEPAGE_HTML" | grep -q 'name="viewport"'; then
        pass "Viewport meta tag present (mobile-first ready)"
    else
        fail "No viewport meta tag — Google mobile-first indexing will penalize this"
    fi

    if echo "$HOMEPAGE_HTML" | grep -qi 'noindex'; then
        fail "Homepage has 'noindex' directive — Google WILL NOT index your site!"
    else
        pass "No noindex directive on homepage"
    fi
else
    fail "Could not fetch homepage HTML"
fi

# ============================================================================
# SECTION 4: STRUCTURED DATA
# ============================================================================
header "4/8" "Structured Data & Rich Results"

if [ -n "$HOMEPAGE_HTML" ]; then
    if echo "$HOMEPAGE_HTML" | grep -q 'application/ld+json'; then
        pass "JSON-LD structured data found"
        if echo "$HOMEPAGE_HTML" | grep -q '"@type".*"Organization"'; then
            pass "Organization schema present"
        else
            warn "No Organization schema"
        fi
        if echo "$HOMEPAGE_HTML" | grep -q '"@type".*"WebSite"'; then
            pass "WebSite schema present (enables sitelinks search box)"
        else
            warn "No WebSite schema"
        fi
    else
        fail "No JSON-LD structured data"
    fi
fi

# FIX: Get product slug from DB instead of parsing HTML
PRODUCT_SLUG=""
if command -v psql &> /dev/null; then
    PRODUCT_SLUG=$(sudo -u postgres psql -d "$DB_NAME" -tAc "SELECT slug FROM products WHERE status='approved' AND slug IS NOT NULL LIMIT 1;" 2>/dev/null)
fi

if [ -n "$PRODUCT_SLUG" ]; then
    PRODUCT_HTML=$(curl -s "${SITE_URL}/products/${PRODUCT_SLUG}" 2>/dev/null)
    if echo "$PRODUCT_HTML" | grep -q '"@type".*"Product"'; then
        pass "Product schema found on product pages"
        if echo "$PRODUCT_HTML" | grep -q '"offers"'; then
            pass "Product offers/pricing in schema (enables price in search results)"
        else
            warn "No offers in Product schema"
        fi
        if echo "$PRODUCT_HTML" | grep -q '"aggregateRating"\|"review"'; then
            pass "Review/rating data in Product schema"
        else
            warn "No review data in Product schema — ratings boost CTR"
        fi
    else
        warn "No Product schema detected on product page"
    fi
else
    skip "Could not find a product page to check Product schema"
fi

if [ -n "$PRODUCT_HTML" ]; then
    if echo "$PRODUCT_HTML" | grep -q '"BreadcrumbList"'; then
        pass "BreadcrumbList schema present"
    else
        warn "No BreadcrumbList schema"
    fi
fi

# ============================================================================
# SECTION 5: PERFORMANCE & CORE WEB VITALS
# ============================================================================
header "5/8" "Performance & Core Web Vitals"

# FIX: Use curl time_starttransfer for actual TTFB, median of 3 requests
TTFB_1=$(curl -o /dev/null -s -w "%{time_starttransfer}" "${SITE_URL}" 2>/dev/null)
TTFB_2=$(curl -o /dev/null -s -w "%{time_starttransfer}" "${SITE_URL}" 2>/dev/null)
TTFB_3=$(curl -o /dev/null -s -w "%{time_starttransfer}" "${SITE_URL}" 2>/dev/null)

TTFB_MS_1=$(echo "$TTFB_1" | awk '{printf "%d", $1 * 1000}')
TTFB_MS_2=$(echo "$TTFB_2" | awk '{printf "%d", $1 * 1000}')
TTFB_MS_3=$(echo "$TTFB_3" | awk '{printf "%d", $1 * 1000}')
RESPONSE_MS=$(echo -e "${TTFB_MS_1}\n${TTFB_MS_2}\n${TTFB_MS_3}" | sort -n | sed -n '2p')

if [ -n "$RESPONSE_MS" ] && [ "$RESPONSE_MS" -gt 0 ]; then
    if [ "$RESPONSE_MS" -lt 500 ]; then
        pass "Homepage TTFB: ${RESPONSE_MS}ms (excellent — median of 3)"
    elif [ "$RESPONSE_MS" -lt 1000 ]; then
        pass "Homepage TTFB: ${RESPONSE_MS}ms (good — median of 3)"
    elif [ "$RESPONSE_MS" -lt 2500 ]; then
        warn "Homepage TTFB: ${RESPONSE_MS}ms — aim for under 500ms (median of 3)"
    else
        fail "Homepage TTFB: ${RESPONSE_MS}ms (too slow — median of 3)"
    fi
else
    fail "Could not measure homepage TTFB"
fi

# FIX: Send Accept-Encoding header to trigger compression response
COMPRESS_HEADER=$(curl -sI -H "Accept-Encoding: gzip, deflate, br" "${SITE_URL}" 2>/dev/null | grep -i "content-encoding")
if echo "$COMPRESS_HEADER" | grep -qi "gzip\|br"; then
    ENCODING=$(echo "$COMPRESS_HEADER" | awk -F: '{print $2}' | xargs)
    pass "Response compression enabled (${ENCODING})"
else
    warn "No response compression detected — enable gzip/brotli"
fi

HEADERS=$(curl -sI "${SITE_URL}" 2>/dev/null)

if echo "$HEADERS" | grep -qi "cache-control"; then
    pass "Cache-Control header present"
else
    warn "No Cache-Control header"
fi

if echo "$HEADERS" | grep -qi "x-frame-options\|content-security-policy"; then
    pass "Security headers present (X-Frame-Options or CSP)"
else
    warn "Missing security headers"
fi

if echo "$HEADERS" | grep -qi "x-powered-by"; then
    warn "X-Powered-By header exposed"
else
    pass "X-Powered-By header not exposed"
fi

# FIX: Check next/image in source code, not just rendered HTML
if echo "$HOMEPAGE_HTML" | grep -q '_next/static\|__next'; then
    pass "Next.js static asset pipeline detected"
    if echo "$HOMEPAGE_HTML" | grep -q 'next/image\|_next/image\|srcset.*_next'; then
        pass "Next.js Image optimization detected in HTML"
    elif [ -d ~/frontend/storesgo-frontend-v1/components ]; then
        NEXT_IMAGE_COUNT=$(grep -rl "next/image" ~/frontend/storesgo-frontend-v1/components/ --include="*.tsx" 2>/dev/null | wc -l)
        if [ "$NEXT_IMAGE_COUNT" -gt 0 ]; then
            pass "next/image used in ${NEXT_IMAGE_COUNT} component(s)"
        else
            warn "Not using next/image — implement for automatic WebP/AVIF & lazy loading"
        fi
    else
        warn "Not using next/image — implement for automatic WebP/AVIF & lazy loading"
    fi
else
    skip "Cannot detect Next.js asset pipeline"
fi

# ============================================================================
# SECTION 6: DATABASE & CONTENT QUALITY
# ============================================================================
header "6/8" "Database & Content Quality (PostgreSQL)"

if command -v psql &> /dev/null; then
    # FIX: Use sudo -u postgres
    DB_TEST=$(sudo -u postgres psql -d "$DB_NAME" -c "SELECT 1;" 2>&1)
    if echo "$DB_TEST" | grep -q "1"; then
        pass "PostgreSQL connection successful"

        PRODUCT_COUNT=$(sudo -u postgres psql -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM products WHERE status='approved';" 2>/dev/null)
        if [ -n "$PRODUCT_COUNT" ]; then
            pass "Approved products: ${PRODUCT_COUNT}"
        fi

        THIN_PRODUCTS=$(sudo -u postgres psql -d "$DB_NAME" -tAc "
            SELECT COUNT(*) FROM products
            WHERE status='approved' AND (description IS NULL OR LENGTH(TRIM(description)) < 20);" 2>/dev/null)
        if [ -n "$THIN_PRODUCTS" ] && [ "$THIN_PRODUCTS" -gt 0 ]; then
            THIN_PCT=$((THIN_PRODUCTS * 100 / PRODUCT_COUNT))
            if [ "$THIN_PCT" -gt 5 ]; then
                fail "${THIN_PRODUCTS} products with thin/missing descriptions (${THIN_PCT}%)"
            else
                warn "${THIN_PRODUCTS} products with thin/missing descriptions (${THIN_PCT}%) — minor"
            fi
        elif [ -n "$THIN_PRODUCTS" ]; then
            pass "All products have descriptions (20+ chars)"
        else
            skip "Could not query product descriptions"
        fi

        # FIX: Use correct column name imageUrl
        NO_IMAGE=$(sudo -u postgres psql -d "$DB_NAME" -tAc "
            SELECT COUNT(*) FROM products
            WHERE status='approved' AND (\"imageUrl\" IS NULL OR \"imageUrl\" = '' OR \"imageUrl\" = 'null');" 2>/dev/null)
        if [ -n "$NO_IMAGE" ] && [ "$NO_IMAGE" -gt 0 ]; then
            fail "${NO_IMAGE} products have no images"
        elif [ -n "$NO_IMAGE" ]; then
            pass "All products have image URLs"
        else
            skip "Could not query product images"
        fi

        DUPES=$(sudo -u postgres psql -d "$DB_NAME" -tAc "
            SELECT COUNT(*) FROM (
                SELECT name, COUNT(*) as cnt FROM products WHERE status='approved'
                GROUP BY name HAVING COUNT(*) > 1
            ) dupes;" 2>/dev/null)
        if [ -n "$DUPES" ] && [ "$DUPES" -gt 0 ]; then
            warn "${DUPES} duplicate product names — potential SEO cannibalization"
        elif [ -n "$DUPES" ]; then
            pass "No duplicate product names"
        else
            skip "Could not check for duplicate products"
        fi

        NO_CAT=$(sudo -u postgres psql -d "$DB_NAME" -tAc "
            SELECT COUNT(*) FROM products WHERE status='approved' AND category_id IS NULL;" 2>/dev/null)
        if [ -n "$NO_CAT" ] && [ "$NO_CAT" -gt 0 ]; then
            warn "${NO_CAT} products without categories"
        elif [ -n "$NO_CAT" ]; then
            pass "All products are categorized"
        else
            skip "Could not check product categories"
        fi

        # FIX: Use correct column name priceCents
        NO_PRICE=$(sudo -u postgres psql -d "$DB_NAME" -tAc "
            SELECT COUNT(*) FROM products
            WHERE status='approved' AND (\"priceCents\" IS NULL OR \"priceCents\" = 0);" 2>/dev/null)
        if [ -n "$NO_PRICE" ] && [ "$NO_PRICE" -gt 0 ]; then
            fail "${NO_PRICE} products with no/zero price — breaks Google Merchant Center"
        elif [ -n "$NO_PRICE" ]; then
            pass "All products have prices"
        else
            skip "Could not check product prices"
        fi

        SELLER_COUNT=$(sudo -u postgres psql -d "$DB_NAME" -tAc "
            SELECT COUNT(*) FROM sellers WHERE status = 'active';" 2>/dev/null)
        if [ -n "$SELLER_COUNT" ]; then
            pass "Active sellers: ${SELLER_COUNT}"
        fi

        DB_SIZE=$(sudo -u postgres psql -d "$DB_NAME" -tAc "
            SELECT pg_size_pretty(pg_database_size('${DB_NAME}'));" 2>/dev/null)
        if [ -n "$DB_SIZE" ]; then
            pass "Database size: ${DB_SIZE}"
        fi
    else
        skip "Cannot connect to PostgreSQL database '${DB_NAME}'"
    fi
else
    skip "psql not available — cannot audit database"
fi

# ============================================================================
# SECTION 7: MARKETPLACE COMPLIANCE
# ============================================================================
header "7/8" "Marketplace Compliance & Trust Signals"

PAGES=("about" "contact" "terms" "privacy" "return-policy" "shipping" "faq")
PAGE_NAMES=("About Us" "Contact" "Terms of Service" "Privacy Policy" "Return Policy" "Shipping Info" "FAQ")

for i in "${!PAGES[@]}"; do
    PAGE_CODE=$(curl -o /dev/null -s -w "%{http_code}" "${SITE_URL}/${PAGES[$i]}" 2>/dev/null)
    if [ "$PAGE_CODE" == "200" ]; then
        pass "${PAGE_NAMES[$i]} page exists (/${PAGES[$i]})"
    elif [ "$PAGE_CODE" == "301" ] || [ "$PAGE_CODE" == "302" ]; then
        pass "${PAGE_NAMES[$i]} page exists (redirects)"
    else
        fail "Missing ${PAGE_NAMES[$i]} page (/${PAGES[$i]}) — HTTP ${PAGE_CODE}"
    fi
done

SELLER_PAGE=$(curl -o /dev/null -s -w "%{http_code}" "${SITE_URL}/sellers" 2>/dev/null)
if [ "$SELLER_PAGE" == "200" ]; then
    pass "Seller directory accessible at /sellers"
else
    warn "No seller directory at /sellers (HTTP ${SELLER_PAGE})"
fi

CART_PAGE=$(curl -o /dev/null -s -w "%{http_code}" "${SITE_URL}/cart" 2>/dev/null)
if [ "$CART_PAGE" == "200" ] || [ "$CART_PAGE" == "302" ]; then
    pass "Cart page accessible"
else
    warn "Cart page returned HTTP ${CART_PAGE}"
fi

echo ""
echo -e "  ${CYAN}--- Google Merchant Center Compliance ---${NC}"

FEED_CODE=$(curl -o /dev/null -s -w "%{http_code}" "${SITE_URL}/feed/google-shopping" 2>/dev/null)
FEED_CODE2=$(curl -o /dev/null -s -w "%{http_code}" "${SITE_URL}/api/feeds/google" 2>/dev/null)
FEED_CODE3=$(curl -o /dev/null -s -w "%{http_code}" "${SITE_URL}/feed.xml" 2>/dev/null)
if [ "$FEED_CODE" == "200" ] || [ "$FEED_CODE2" == "200" ] || [ "$FEED_CODE3" == "200" ]; then
    pass "Google Shopping product feed endpoint found"
else
    warn "No Google Shopping feed detected"
fi

# ============================================================================
# SECTION 8: SECURITY & INFRASTRUCTURE
# ============================================================================
header "8/8" "Security & Infrastructure"

EXPOSED_FILES=(".env" ".git/config" "package.json" ".next/BUILD_ID")
for f in "${EXPOSED_FILES[@]}"; do
    STATUS=$(curl -o /dev/null -s -w "%{http_code}" "${SITE_URL}/${f}" 2>/dev/null)
    if [ "$STATUS" == "200" ]; then
        fail "SECURITY: /${f} is publicly accessible!"
    else
        pass "/${f} not publicly accessible"
    fi
done

API_HEALTH=$(curl -o /dev/null -s -w "%{http_code}" "${SITE_URL}/api/health" 2>/dev/null)
if [ "$API_HEALTH" == "200" ]; then
    pass "API health endpoint responding"
fi

# FIX: Use sudo for nginx -t and capture stderr
if command -v nginx &> /dev/null; then
    NGINX_STATUS=$(systemctl is-active nginx 2>/dev/null)
    if [ "$NGINX_STATUS" == "active" ]; then
        pass "Nginx is running"
        NGINX_TEST=$(sudo nginx -t 2>&1)
        if echo "$NGINX_TEST" | grep -q "successful"; then
            pass "Nginx configuration valid"
        else
            fail "Nginx configuration has errors"
        fi
    else
        warn "Nginx installed but not active"
    fi
fi

# FIX: Use sudo for ufw status
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(sudo ufw status 2>/dev/null | head -1)
    if echo "$UFW_STATUS" | grep -q "active"; then
        pass "Firewall (UFW) is active"
        UFW_ALLOW=$(sudo ufw status 2>/dev/null | grep "ALLOW" | wc -l)
        pass "UFW has ${UFW_ALLOW} ALLOW rule(s) configured"
    else
        warn "Firewall (UFW) is inactive — enable for production security"
    fi
elif command -v iptables &> /dev/null; then
    RULES=$(sudo iptables -L 2>/dev/null | wc -l)
    if [ "$RULES" -gt 8 ]; then
        pass "iptables has active rules"
    else
        warn "iptables appears to have minimal rules"
    fi
fi

echo ""
echo -e "  ${CYAN}--- Background Jobs ---${NC}"
CRON_JOBS=$(crontab -l 2>/dev/null | grep -v "^#" | grep -v "^$" | wc -l)
if [ "$CRON_JOBS" -gt 0 ]; then
    pass "${CRON_JOBS} cron job(s) configured"
else
    warn "No cron jobs found"
fi

if command -v oci &> /dev/null; then
    pass "OCI CLI installed"
else
    skip "OCI CLI not found (may be managed externally)"
fi

# ============================================================================
# AUDIT SUMMARY
# ============================================================================
echo ""
echo -e "${BOLD}${YELLOW}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                     AUDIT SUMMARY                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
TOTAL=$((PASS_COUNT + FAIL_COUNT + WARN_COUNT + SKIP_COUNT))
echo -e "  ${GREEN}PASSED:  ${PASS_COUNT}${NC}"
echo -e "  ${RED}FAILED:  ${FAIL_COUNT}${NC}"
echo -e "  ${YELLOW}WARNINGS: ${WARN_COUNT}${NC}"
echo -e "  ${CYAN}SKIPPED: ${SKIP_COUNT}${NC}"
echo -e "  ─────────────────"
echo -e "  TOTAL:   ${TOTAL} checks"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo -e "  ${GREEN}${BOLD}✓ All clear — no critical failures detected${NC}"
elif [ "$FAIL_COUNT" -le 3 ]; then
    echo -e "  ${YELLOW}${BOLD}⚠ ${FAIL_COUNT} critical issue(s) need attention${NC}"
else
    echo -e "  ${RED}${BOLD}✗ ${FAIL_COUNT} critical issues — address before expecting Google Page 1${NC}"
fi

echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo "  1. Fix all [FAIL] items first"
echo "  2. Address [WARN] items for competitive advantage"
echo "  3. PageSpeed Insights: https://pagespeed.web.dev/analysis?url=${SITE_URL}"
echo "  4. Rich Results Test: https://search.google.com/test/rich-results?url=${SITE_URL}"
echo "  5. Search Console: https://search.google.com/search-console"
echo ""
echo -e "${YELLOW}Audit completed: $(date)${NC}"
