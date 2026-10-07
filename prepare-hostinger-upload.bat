@echo off
REM Prepare Hostinger upload package for Windows
REM This creates a zip file with only the files needed for Hostinger deployment

echo Building MindLedger Lite for Hostinger...
call npm run build

echo.
echo Creating Hostinger upload package...

REM Check if dist folder exists
if not exist "dist" (
    echo ERROR: dist folder not found. Build failed.
    exit /b 1
)

REM Check if .htaccess exists
if not exist "public\.htaccess" (
    echo ERROR: public\.htaccess not found.
    exit /b 1
)

REM Create temporary folder structure
if exist "temp-mindledger" rmdir /s /q "temp-mindledger"
mkdir temp-mindledger\mindledger

REM Copy files
xcopy /E /I dist temp-mindledger\mindledger
copy public\.htaccess temp-mindledger\mindledger\.htaccess
del /q temp-mindledger\mindledger\server.cjs temp-mindledger\mindledger\server.cjs.map 2>nul

REM Create zip file (requires 7-Zip or similar)
REM This uses PowerShell which is available on Windows 10+
powershell -NoProfile -Command "Add-Type -Assembly System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('%cd%\temp-mindledger', '%cd%\mindledger-hostinger-upload.zip')"

REM Clean up
rmdir /s /q temp-mindledger

echo.
echo Upload package created: mindledger-hostinger-upload.zip
echo.
echo To upload to Hostinger:
echo   1. Log in to Hostinger Control Panel - File Manager
echo   2. Navigate to /public_html
echo   3. Upload mindledger-hostinger-upload.zip
echo   4. Right-click - Extract
echo   5. Visit: https://yourdomain.com/mindledger/
echo.
pause
