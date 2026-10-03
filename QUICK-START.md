# Mentra Backend - Quick Start Guide

## What's Included ✅

Your backend is ready with:
- **Slug-based psychologist pages** (`/book/dr-priya`)
- **Database-only scheduling** (no Google Calendar needed)
- **Razorpay payment integration**
- **REST API** for all operations
- **Email notifications**
- **Hostinger optimized**

## 5-Minute Setup

### 1️⃣ Create Database (2 minutes)
In Hostinger cPanel:
- Go to **Databases** → **MySQL Databases**
- Create: `mentra_booking`
- Create user: `mentra_user` with password
- Run `/database/schema.sql`

### 2️⃣ Update Configuration (2 minutes)
Edit `/config/Database.php`:
```php
private $db_name = 'mentra_booking';
private $db_user = 'mentra_user';
private $db_pass = 'YourPassword';
```

Edit `/config/Config.php`:
```php
define('APP_URL', 'https://yourdomain.com');
define('RAZORPAY_KEY_ID', 'rzp_test_...');
define('RAZORPAY_KEY_SECRET', '...');
define('ADMIN_EMAIL', 'admin@yourdomain.com');
```

### 3️⃣ Test API (1 minute)
Visit: `https://yourdomain.com/api/psychologists`

You should see: `{"success":true,"data":[]}`

✅ **Backend is live!**

## Add First Psychologist

Create `/public_html/add-psychologist.php`:
```php
<?php
require_once 'config/Database.php';
require_once 'config/Config.php';
require_once 'includes/Psychologist.php';

$pdo = (new Database())->connect();
$psy = new Psychologist($pdo);

$result = $psy->create([
    'name' => 'Dr. Priya Sharma',
    'email' => 'priya@mentra.com',
    'phone' => '9876543210',
    'gender' => 'female',
    'bio' => 'Licensed psychologist',
    'hourly_fee' => 999,
    'session_minutes' => 60
]);

echo json_encode($result);
?>
```

Visit: `https://yourdomain.com/add-psychologist.php`
Then **delete** the file.

## API Endpoints

### Get All Psychologists
```
GET /api/psychologists
Response: [{ id, name, slug, fee, bio, ... }]
```

### Get Psychologist by Slug
```
GET /api/psychologists/dr-priya
Response: { id, name, slug, schedule, ... }
```

### Get Available Slots
```
GET /api/slots/1/2024-10-15
Response: [{ start_time, end_time, ... }]
```

### Create Booking
```
POST /api/bookings
Body: {
    psychologist_id: 1,
    slot_date: "2024-10-15",
    start_time: "10:00:00",
    end_time: "11:00:00",
    client_name: "John Doe",
    client_phone: "9876543210",
    client_email: "john@example.com",
    amount: 999
}
```

### Create Payment Order
```
POST /api/payment/order
Body: {
    booking_id: 1,
    amount: 999
}
Response: { order_id, key_id, amount, ... }
```

### Verify Payment
```
POST /api/payment/verify
Body: {
    razorpay_order_id: "order_...",
    razorpay_payment_id: "pay_...",
    razorpay_signature: "signature"
}
```

## Frontend Integration Example

```javascript
// 1. Fetch psychologists
fetch('https://yourdomain.com/api/psychologists')
    .then(r => r.json())
    .then(data => console.log(data.data));

// 2. Create booking
fetch('https://yourdomain.com/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        psychologist_id: 1,
        slot_date: '2024-10-15',
        start_time: '10:00:00',
        end_time: '11:00:00',
        client_name: 'John',
        client_phone: '9876543210',
        amount: 999
    })
})
.then(r => r.json())
.then(booking => {
    // Create payment order
    return fetch('https://yourdomain.com/api/payment/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            booking_id: booking.id,
            amount: booking.final_amount || 999
        })
    });
})
.then(r => r.json())
.then(order => {
    // Use order.order_id with Razorpay checkout
    console.log('Ready for payment', order);
});
```

## Database Schema

### psychologists
- id, slug, name, email, phone, gender
- bio, qualifications, specializations, languages
- concerns, photo_url, hourly_fee, session_minutes
- is_active, experience_years, registration_number

### bookings
- id, booking_code, psychologist_id, time_slot_id
- slot_date, start_time, end_time
- client_name, client_phone, client_email, client_age
- amount, coupon_code, discount_amount, final_amount
- payment_status, razorpay_order_id, razorpay_payment_id
- booking_status, source_page, utm_*, created_at

### time_slots
- id, psychologist_id, slot_date, start_time, end_time
- status (available, booked, hold, blocked)

### psychologist_schedules
- id, psychologist_id, day_of_week (0-6)
- start_time, end_time, slot_step_minutes

### days_off
- id, psychologist_id, date, reason

## File Structure

```
├── config/
│   ├── Config.php          # Main settings
│   └── Database.php        # Database connection
├── database/
│   └── schema.sql          # Database tables
├── api/
│   └── index.php           # API router
├── includes/
│   ├── Psychologist.php    # Psychologist class
│   ├── Booking.php         # Booking class
│   ├── Payment.php         # Razorpay
│   └── Email.php           # Email notifications
├── .htaccess               # URL rewriting
├── README.md               # Full documentation
└── INSTALLATION.md         # Detailed setup
```

## Common Tasks

### Add Psychologist Schedule
```php
$psy->createSchedule(
    $psychologist_id,  // 1
    1,                 // Monday (0=Sun, 6=Sat)
    '10:00:00',        // Start
    '18:00:00',        // End
    30                 // Slot interval
);
```

### Add Day Off
```php
$psy->addDayOff($psychologist_id, '2024-10-20', 'Holiday');
```

### Generate Slots
```php
$psy->generateSlots($psychologist_id, '2024-10-01', '2024-10-31');
```

### Cancel Booking
```php
$booking->cancel($booking_id);
// Refunds slot and sends notification
```

## Razorpay Test Keys

Get from: https://dashboard.razorpay.com/app/keys

**Test UPI:** `success@razorpay`
**Test Card:** `4111 1111 1111 1111` + any CVV + future date

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot connect to database" | Check Database.php credentials |
| API returns 404 | Check if files are uploaded to public_html |
| Empty psychologist list | Add psychologists first |
| Payment fails | Use Razorpay test credentials |
| Emails not sending | Check MAIL_FROM in Config.php |

## Next Steps

1. ✅ Upload backend files to Hostinger
2. ✅ Create database
3. ✅ Configure settings
4. ✅ Test API endpoints
5. 📝 Build admin panel (coming soon)
6. 🔗 Integrate with frontend
7. 🚀 Go live with real Razorpay keys

## Support

- **Installation help:** See INSTALLATION.md
- **Razorpay docs:** https://razorpay.com/docs
- **Hostinger support:** https://support.hostinger.com
- **Code issues:** Check `/logs/error.log`

---

**Your Mentra backend is ready! Deploy it now.** 🚀
