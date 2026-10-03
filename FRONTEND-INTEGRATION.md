# 🎯 MENTRA - Complete Frontend + Backend Integration Guide

## ✅ What You Now Have

Your Mentra system is **fully integrated** with:

### Backend (PHP + MySQL)
- ✅ Complete REST API (`/api/` endpoints)
- ✅ Admin panel for psychologist management
- ✅ Booking and payment processing
- ✅ Google Meet link generation
- ✅ Email notifications

### Frontend (JavaScript)
- ✅ Beautiful responsive website
- ✅ Booking interface with psychologist selection
- ✅ Payment integration ready
- ✅ Auto-loads psychologists from backend API
- ✅ Dynamic schedule loading

### Integration Layer
- ✅ `mentra-api.js` - Connects frontend to backend
- ✅ Updated `config.js` - Configure API endpoint

---

## 🚀 Quick Start - Complete Deployment

### Step 1: Update Configuration

**File:** `config.js`

Change this line:
```javascript
BOOKING_API_URL: "https://yourdomain.com/api",
```

Replace `yourdomain.com` with your actual domain.

**Also update:**
```javascript
CONTACT_EMAIL: "your@email.com",
CONTACT_PHONE: "+91-9876543210",
SHOW_TEAM: true,  // Shows psychologists on homepage
```

### Step 2: Upload Everything to Hostinger

**What gets uploaded:**

```
Frontend Files (goes to public_html/):
├── index.html
├── config.js (ALREADY UPDATED ✓)
├── mentra-api.js (NEW - API integration)
├── site.js, site.css
├── footer.js, footer.css
├── psychologists.js (hard-coded backup)
├── contact.html, privacy.html, terms.html, etc.
├── robots.txt, sitemap.xml
├── .htaccess
├── assets/ (folder with images/logos)
├── book/ (booking interface)
├── psychologists/ (psychologist listing)
├── services/ (service pages)
├── about/ (about page)
├── find-a-psychologist/ (screening questionnaire)

Backend Files (already prepared):
├── config/ (Database.php, Config.php)
├── database/ (schema.sql)
├── api/ (index.php - REST API)
├── includes/ (business logic classes)
├── admin/ (admin panel)
```

### Step 3: Configure Backend (Database & API Keys)

Edit on Hostinger via File Manager:

**1. `/config/Database.php`**
```php
private $db_name = 'mentra_booking';
private $db_user = 'mentra_user';
private $db_pass = 'YourDatabasePassword';
```

**2. `/config/Config.php`**
```php
define('APP_URL', 'https://yourdomain.com');
define('RAZORPAY_KEY_ID', 'rzp_test_...');
define('RAZORPAY_KEY_SECRET', 'your_secret');
```

### Step 4: Create MySQL Database

In Hostinger → Databases → MySQL:

1. Create database: `mentra_booking`
2. Create user: `mentra_user`
3. Add user to database with all privileges
4. Import `database/schema.sql` via phpMyAdmin

### Step 5: Create Admin User

In phpMyAdmin → `admin_users` table:

Insert admin credentials:
- username: `admin`
- password_hash: (use hash.php to generate)
- email: `admin@yourdomain.com`

### Step 6: Test Everything

Visit your domain and check:

```
✅ Homepage: https://yourdomain.com
   - Psychologists load from backend
   - Layout looks good

✅ API Health: https://yourdomain.com/api/psychologists
   - Should return JSON with psychologist data
   - Response: {"success":true,"data":[...]}

✅ Booking: https://yourdomain.com/book/
   - Booking interface loads
   - Psychologists appear (from API)

✅ Admin Panel: https://yourdomain.com/admin/login.php
   - Login page appears
   - Login works
   - Dashboard shows statistics
```

---

## 🔄 How It Works - Frontend-Backend Flow

### Loading Psychologists

```
1. Frontend loads (any page)
   ↓
2. config.js loads → sets BOOKING_API_URL
   ↓
3. mentra-api.js loads → checks API_URL
   ↓
4. On page ready: mentra-api.js calls /api/psychologists
   ↓
5. Backend returns JSON with all psychologists
   ↓
6. Frontend updates window.MENTRA_PSYCHOLOGISTS
   ↓
7. site.js displays psychologists on page
   ↓
8. If API fails: Falls back to hard-coded psychologists.js
```

### Booking Flow

```
User clicks "Book a session"
   ↓
Fills in details and selects psychologist
   ↓
Frontend calls: window.MENTRA_API.createBooking()
   ↓
API validates and creates booking in database
   ↓
Returns booking_code to frontend
   ↓
Frontend calls: window.MENTRA_API.createPaymentOrder()
   ↓
Razorpay order created (with payment details)
   ↓
Razorpay payment gateway loads
   ↓
User completes payment
   ↓
Frontend calls: window.MENTRA_API.verifyPayment()
   ↓
Backend verifies signature and confirms booking
   ↓
Backend generates Google Meet link
   ↓
Backend sends confirmation email to user
   ↓
✅ Booking complete!
```

---

## 📂 File Structure

```
mentra-booking-system/
│
├── Frontend Files (Website)
│   ├── index.html
│   ├── config.js ← EDIT: Set API_URL and contact details
│   ├── mentra-api.js ← NEW: Connects to backend
│   ├── site.js, site.css
│   ├── book/ → Booking interface
│   ├── psychologists/ → Psychologist listing
│   ├── find-a-psychologist/ → Screening questionnaire
│   ├── assets/ → Images and logos
│   └── [other pages]
│
├── Backend Files (PHP + MySQL)
│   ├── config/
│   │   ├── Database.php ← EDIT: DB credentials
│   │   └── Config.php ← EDIT: Domain, Razorpay keys
│   │
│   ├── database/
│   │   └── schema.sql → SQL table definitions
│   │
│   ├── api/
│   │   └── index.php → REST API endpoints
│   │
│   ├── includes/
│   │   ├── Psychologist.php
│   │   ├── Booking.php
│   │   ├── Payment.php
│   │   ├── Email.php
│   │   └── GoogleMeet.php
│   │
│   └── admin/
│       ├── login.php
│       ├── dashboard.php
│       ├── psychologists.php
│       ├── bookings.php
│       └── [other admin pages]
│
└── Documentation
    ├── FRONTEND-INTEGRATION.md (this file)
    ├── HOSTINGER-UPLOAD-GUIDE.md
    ├── ADMIN-GUIDE.md
    ├── INSTALLATION.md
    └── README.md
```

---

## 🔑 Key Configuration Values

### config.js (Frontend)
```javascript
BOOKING_API_URL: "https://yourdomain.com/api"  // Backend API endpoint
REQUIRE_PAYMENT: true                           // Enable Razorpay
SHOW_TEAM: true                                 // Show psychologists
CONTACT_EMAIL: "admin@yourdomain.com"
CONTACT_PHONE: "+91-9876543210"
```

### Config.php (Backend)
```php
define('APP_URL', 'https://yourdomain.com');
define('RAZORPAY_KEY_ID', 'rzp_test_...');     // Test or Live
define('RAZORPAY_KEY_SECRET', 'your_secret');
define('BUSINESS_EMAIL', 'admin@yourdomain.com');
define('BUSINESS_PHONE', '+91-9876543210');
```

### Database.php (Backend)
```php
private $db_name = 'mentra_booking';
private $db_user = 'mentra_user';
private $db_pass = 'your_password';
private $host = 'localhost';
```

---

## 📡 API Endpoints

### Available Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/psychologists` | Get all psychologists |
| GET | `/api/psychologists/[slug]` | Get one psychologist |
| GET | `/api/slots/[id]/[date]` | Get available time slots |
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings/[code]` | Get booking details |
| POST | `/api/payment/order` | Create Razorpay order |
| POST | `/api/payment/verify` | Verify payment |

### Example API Calls

#### Get all psychologists
```bash
curl https://yourdomain.com/api/psychologists
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Dr. Priya Sharma",
      "slug": "dr-priya-sharma",
      "hourly_fee": 999,
      "bio": "...",
      "is_active": 1
    }
  ]
}
```

#### Get time slots
```bash
curl https://yourdomain.com/api/slots/1/2026-10-10
```

#### Create booking
```bash
curl -X POST https://yourdomain.com/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "psychologist_id": 1,
    "slot_date": "2026-10-10",
    "start_time": "10:00",
    "client_name": "John Doe",
    "client_email": "john@example.com",
    "client_phone": "+919876543210"
  }'
```

---

## 🔒 Security Notes

### Frontend (mentra-api.js)
- ✅ Never stores passwords
- ✅ Uses HTTPS only
- ✅ CORS-friendly requests
- ✅ Input validation on forms

### Backend (PHP)
- ✅ Prepared statements (prevents SQL injection)
- ✅ Password hashing (bcrypt)
- ✅ Razorpay signature verification
- ✅ Session-based authentication

### Database
- ✅ Create strong password for `mentra_user`
- ✅ Limit DB user to `mentra_booking` database only
- ✅ Regular backups

---

## 🆘 Troubleshooting

### Psychologists Not Loading
**Problem:** Homepage shows "Our psychologists are joining soon"

**Solution:**
1. Check `config.js` - is `BOOKING_API_URL` correct?
2. Check browser console (F12 → Console) for errors
3. Test API: Visit `https://yourdomain.com/api/psychologists` directly
4. Check backend database - are psychologists in `psychologists` table?

**Fallback:** If API fails, frontend uses hard-coded `psychologists.js`

### API Returning 404
**Problem:** https://yourdomain.com/api/psychologists returns 404

**Solution:**
1. Check `.htaccess` is uploaded to public_html
2. Check mod_rewrite is enabled on Hostinger
3. Check `api/index.php` exists
4. Check Config.php has correct `APP_URL`

### Booking Not Creating
**Problem:** When trying to book, get error

**Solution:**
1. Check database credentials in `config/Database.php`
2. Check `admin_users` table exists (import schema.sql)
3. Check `bookings` table exists
4. Check logs: `/logs/error.log`

### Payment Not Processing
**Problem:** Razorpay button doesn't appear or payment fails

**Solution:**
1. Check Razorpay keys in `config/Config.php`
2. Use test keys first (rzp_test_...)
3. Check payment settings page in admin

---

## 📋 Deployment Checklist

Before going live:

```
Frontend Setup
☐ config.js updated with API_URL
☐ config.js updated with contact details
☐ All frontend files uploaded to public_html
☐ Assets folder uploaded
☐ .htaccess uploaded

Backend Setup
☐ Database.php configured with DB credentials
☐ Config.php configured with domain
☐ All PHP files uploaded
☐ MySQL database created
☐ schema.sql imported
☐ Admin user created

Testing
☐ API test: https://yourdomain.com/api/psychologists
☐ Homepage loads: https://yourdomain.com
☐ Booking page loads: https://yourdomain.com/book
☐ Admin login works: https://yourdomain.com/admin/login.php
☐ Add psychologist in admin
☐ Test booking flow (with test Razorpay keys)
☐ Check confirmation email sends

Go Live
☐ Update Razorpay keys (from test to live)
☐ Update Config.php with APP_URL
☐ Test again with live keys
☐ Monitor logs for errors
```

---

## 📞 Support Resources

| Need | Document | Location |
|------|----------|----------|
| Setup instructions | HOSTINGER-UPLOAD-GUIDE.md | Root folder |
| Admin usage | ADMIN-GUIDE.md | Root folder |
| API reference | QUICK-START.md | Root folder |
| Full details | INSTALLATION.md | Root folder |

---

## 🎉 You're Ready!

Your complete Mentra booking system is ready to deploy:

1. ✅ Upload files to Hostinger
2. ✅ Configure database & API endpoint
3. ✅ Test everything
4. ✅ Add psychologists via admin
5. ✅ Go live!

**Next Step:** Follow [HOSTINGER-UPLOAD-GUIDE.md](HOSTINGER-UPLOAD-GUIDE.md)

---

**Everything is integrated and ready to use!** 🚀
