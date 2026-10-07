#!/bin/bash

# Prepare Hostinger upload package
# This creates a zip file with only the files needed for Hostinger deployment

set -e

echo "🔨 Building MindLedger Lite for Hostinger..."
npm run build > /dev/null 2>&1

echo "📦 Creating Hostinger upload package..."

# Create a temporary directory for packaging
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Copy build files
mkdir -p "$TEMP_DIR/mindledger"
cp -r dist/. "$TEMP_DIR/mindledger/"
rm -f "$TEMP_DIR/mindledger/server.cjs" "$TEMP_DIR/mindledger/server.cjs.map"

# Copy .htaccess
cp public/.htaccess "$TEMP_DIR/mindledger/.htaccess"

# Create the zip file
cd "$TEMP_DIR"
zip -r mindledger-hostinger-upload.zip mindledger/ > /dev/null
cd - > /dev/null

# Move to project root
mv "$TEMP_DIR/mindledger-hostinger-upload.zip" .

echo ""
echo "✅ Upload package created: mindledger-hostinger-upload.zip"
echo ""
echo "📋 To upload to Hostinger:"
echo "   1. Log in to Hostinger Control Panel → File Manager"
echo "   2. Navigate to /public_html"
echo "   3. Upload mindledger-hostinger-upload.zip"
echo "   4. Right-click → Extract"
echo "   5. Visit: https://yourdomain.com/mindledger/"
echo ""
