# Mentra Backend - Installation Guide for Hostinger

## Prerequisites
- Hostinger Single Web Hosting (or VPS)
- cPanel access
- Your domain name

## Step 1: Access Hostinger File Manager

1. Log in to your Hostinger account
2. Go to **Hosting** → **Manage**
3. Click **File Manager** or **cPanel**
4. Navigate to **public_html** folder

## Step 2: Upload Backend Files

1. Download all files from the GitHub repository
2. Upload to **public_html** folder:
   - `/config/` directory
   - `/database/` directory
   - `/api/` directory
   - `/includes/` directory
   - `.htaccess` file
   - Other necessary files

> **Tip**: Use "Upload Folder" or "Upload Files" in File Manager. Compress files as ZIP and upload to speed up.

## Step 3: Create MySQL Database

1. In Hostinger control panel, go to **Databases** → **MySQL Databases**
2. Click **Create New Database**
3. Enter database name: `mentra_booking` (or your choice)
4. Create a new MySQL user with a strong password
5. Add user to database with all privileges

## Step 4: Configure Database Connection

1. Open `/config/Database.php` in File Manager (right-click → Edit)
2. Update these lines:
```php
private $db_name = 'mentra_booking';      // Your database name
private $db_user = 'mentra_user';          // Your database user
private $db_pass = 'YourStrongPassword';   // Your database password
private $host = 'localhost';               // Usually localhost
```

3. Save the file

## Step 5: Configure Application Settings

1. Open `/config/Config.php` in File Manager (Edit)
2. Update these values:

```php
// Your domain
define('APP_URL', 'https://yourdomain.com');

// Database (same as Step 4)
define('DB_NAME', 'mentra_booking');
define('DB_USER', 'mentra_user');
define('DB_PASS', 'YourStrongPassword');

// Razorpay Keys (from dashboard.razorpay.com)
define('RAZORPAY_KEY_ID', 'rzp_test_XXXXXX');
define('RAZORPAY_KEY_SECRET', 'XXXXXX');

// Business details
define('BUSINESS_PHONE', '+91 9876543210');
define('BUSINESS_EMAIL', 'contact@yourdomain.com');
define('ADMIN_EMAIL', 'admin@yourdomain.com');
```

3. Save the file

## Step 6: Import Database Schema

1. In Hostinger, go to **Databases** → **phpMyAdmin**
2. Select your database `mentra_booking`
3. Click **Import** tab
4. Upload the file: `/database/schema.sql`
5. Click **Import**

✅ Database tables are now created!

## Step 7: Create Admin User

1. In phpMyAdmin, select your database
2. Go to the `admin_users` table
3. Click **Insert** and add your admin account:
   - **username**: `admin`
   - **email**: `your@email.com`
   - **password_hash**: Use PHP to hash your password:
     ```php
     password_hash('your_password', PASSWORD_DEFAULT)
     ```
     (Generate this hash in a temporary PHP file)
   - **full_name**: Your name

## Step 8: Test the Backend

1. Open your browser and go to: `https://yourdomain.com/api/`
2. You should see a JSON response
3. Try the psychologist endpoint: `https://yourdomain.com/api/psychologists`

✅ If you see JSON responses, the backend is working!

## Step 9: Add Psychologists to Backend

### Option A: Using Admin Panel (Recommended - Coming Soon)
Admin panel will be available at `https://yourdomain.com/admin/`

### Option B: Using PHP Script (Quick Setup)
1. Create a temporary file `setup.php` in `public_html`:

```php
<?php
require_once 'config/Database.php';
require_once 'config/Config.php';
require_once 'includes/Psychologist.php';

$database = new Database();
$pdo = $database->connect();
$psychologist = new Psychologist($pdo);

// Add a psychologist
$result = $psychologist->create([
    'name' => 'Dr. Priya Sharma',
    'email' => 'priya@mentra.com',
    'phone' => '9876543210',
    'gender' => 'female',
    'bio' => 'Licensed psychologist specializing in anxiety and depression',
    'qualifications' => 'M.Phil Psychology, Delhi University',
    'specializations' => ['Anxiety', 'Depression', 'Stress'],
    'languages' => ['English', 'Hindi'],
    'concerns' => ['anxiety', 'depression', 'stress'],
    'hourly_fee' => 999,
    'session_minutes' => 60,
    'experience_years' => 5,
    'registration_number' => 'RCI/2020/00123'
]);

echo json_encode($result);
?>
```

2. Visit `https://yourdomain.com/setup.php`
3. It will create the psychologist
4. **Delete `setup.php` immediately after** for security

## Step 10: Add Working Schedule for Psychologist

Use the same method as Step 9, but create schedule:

```php
$psychologist->createSchedule(
    $psychologist_id,  // From previous step
    1,                 // Monday (0=Sunday, 6=Saturday)
    '10:00:00',        // Start time
    '18:00:00',        // End time
    30                 // Slot interval (minutes)
);

// Repeat for all days (0-6)
```

## Step 11: Connect Razorpay

1. Go to [razorpay.com](https://razorpay.com)
2. Sign up and complete KYC
3. Go to **Settings** → **API Keys**
4. Copy your **Test Keys** (rzp_test_...)
5. Paste them in `/config/Config.php`

### Test Payment
- UPI: `success@razorpay`
- Card: `4111 1111 1111 1111` (any future date, any CVV)

## Step 12: Set Up SSL Certificate (HTTPS)

1. In Hostinger control panel, go to **SSL**
2. Install free SSL certificate (usually included)
3. Update `.htaccess` - uncomment HTTPS redirect:

```apache
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

## Step 13: Frontend Integration

Update your frontend booking page to call the API:

```javascript
// Create a booking
fetch('https://yourdomain.com/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        psychologist_id: 1,
        slot_date: '2024-10-15',
        start_time: '10:00:00',
        end_time: '11:00:00',
        client_name: 'John Doe',
        client_phone: '9876543210',
        amount: 999
    })
})
.then(r => r.json())
.then(d => console.log(d));
```

## Troubleshooting

### "Cannot connect to database"
- Check database name, user, password in `/config/Database.php`
- Ensure user has privileges on the database
- Verify database host (usually `localhost`)

### "Psychologist not found" (404)
- Ensure you've added psychologists to the database
- Check the slug format (lowercase, hyphenated)

### API returns empty JSON
- Check if database tables were created
- Verify schema import was successful in phpMyAdmin

### File upload fails
- Ensure `/uploads/` folder exists and is writable
- Set permissions to 755 via FTP

## File Structure After Installation

```
/public_html/
├── .htaccess                 # URL rewriting
├── config/
│   ├── Config.php           # Settings
│   └── Database.php         # Database connection
├── database/
│   └── schema.sql          # Database schema
├── api/
│   └── index.php           # API endpoints
├── includes/
│   ├── Psychologist.php    # Psychologist class
│   ├── Booking.php         # Booking class
│   └── Payment.php         # Razorpay integration
├── admin/                  # Admin panel (optional)
├── uploads/                # Psychologist photos
└── logs/                   # Error logs
```

## Next Steps

1. ✅ Upload files
2. ✅ Create database
3. ✅ Configure settings
4. ✅ Add psychologists
5. ✅ Test API endpoints
6. ✅ Integrate with frontend
7. 🔄 Build admin panel

## Support

For issues with this backend, check:
- `/logs/error.log` for error messages
- Hostinger support for hosting-related issues
- Razorpay docs for payment issues

---

**Backend is ready! Your Mentra booking system is now live.** 🚀
