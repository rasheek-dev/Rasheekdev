/* Mentra site settings. Edit the values in quotes; nothing else. */
window.MENTRA_CONFIG = {
  // Backend API URL - connects to PHP backend for psychologists, bookings, payments
  // Change yourdomain.com to your actual domain
  BOOKING_API_URL: "https://yourdomain.com/api",

  // Meta (Facebook) Pixel ID, for ad measurement
  META_PIXEL_ID: "YOUR_META_PIXEL_ID",

  // true = clients pay online (Razorpay) before a booking is confirmed. false = bookings are confirmed without payment.
  REQUIRE_PAYMENT: true,

  // Mentra's WhatsApp number for the "Chat on WhatsApp" buttons: digits only with country code, e.g. "919900000000".
  // Leave empty and those buttons stay hidden.
  WHATSAPP_NUMBER: "",

  // Public website: show the psychologists on the main website. Keep false until real psychologists are in the database.
  SHOW_TEAM: true,

  // Public website contact details (anything left empty is simply not shown)
  CONTACT_EMAIL: "your@email.com",
  CONTACT_PHONE: "+91-9876543210",
  ADDRESS: "Kozhikode, Kerala, India",

  // All times on the site are India Standard Time
  TIMEZONE: "Asia/Kolkata"
};
