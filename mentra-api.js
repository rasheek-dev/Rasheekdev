/* MENTRA API Integration Layer
   Connects frontend to PHP backend.
   Handles: psychologists, schedules, bookings, payments, meet links
*/

(function() {
  'use strict';

  const API_URL = (window.MENTRA_CONFIG?.BOOKING_API_URL || '').replace(/\/$/, '');
  if (!API_URL) {
    console.error('❌ BOOKING_API_URL not configured in config.js');
    return;
  }

  // API Response Handler
  const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `API Error: ${response.status}`);
    }
    return data;
  };

  // ========== PSYCHOLOGISTS ==========
  window.MENTRA_API = {

    // Get all psychologists from backend
    getPsychologists: async () => {
      try {
        const response = await fetch(`${API_URL}/psychologists`);
        const data = await handleResponse(response);

        if (data.success && Array.isArray(data.data)) {
          return data.data.map(p => ({
            id: `psy_${p.id}`,
            active: p.is_active === 1,
            name: p.name,
            firstName: p.name.split(' ')[0],
            title: p.specialization || 'Psychologist',
            qualification: p.qualifications || '',
            registration: p.registration_number || '',
            languages: [],
            experience: p.experience ? `${p.experience}+ Years` : '',
            focus: [],
            about: p.bio || '',
            fee: Number(p.hourly_fee) || 0,
            mins: Number(p.session_duration) || 45,
            photo: `../assets/psychologist-${p.gender === 'female' ? 'female' : 'male'}.jpg`,
            gender: p.gender || 'male',
            concerns: ['anxiety', 'depression', 'relationships', 'family'],
            specialties: [],
            routeKey: 'counselling',
            slug: p.slug || p.name.toLowerCase().replace(/\s+/g, '-')
          }));
        }
        return [];
      } catch (error) {
        console.error('❌ Failed to load psychologists:', error);
        return [];
      }
    },

    // Get one psychologist by slug
    getPsychologistBySlug: async (slug) => {
      try {
        const response = await fetch(`${API_URL}/psychologists/${slug}`);
        const data = await handleResponse(response);

        if (data.success && data.data) {
          const p = data.data;
          return {
            id: `psy_${p.id}`,
            active: p.is_active === 1,
            name: p.name,
            firstName: p.name.split(' ')[0],
            title: p.specialization || 'Psychologist',
            qualification: p.qualifications || '',
            registration: p.registration_number || '',
            fee: Number(p.hourly_fee) || 0,
            mins: Number(p.session_duration) || 45,
            about: p.bio || '',
            photo: `../assets/psychologist-${p.gender === 'female' ? 'female' : 'male'}.jpg`,
            gender: p.gender || 'male',
            slug: slug
          };
        }
        return null;
      } catch (error) {
        console.error('❌ Failed to load psychologist:', error);
        return null;
      }
    },

    // Get available time slots for a psychologist on a specific date
    getSlots: async (psychologistId, date) => {
      try {
        const response = await fetch(`${API_URL}/slots/${psychologistId}/${date}`);
        const data = await handleResponse(response);

        if (data.success && Array.isArray(data.data)) {
          return data.data.map(slot => ({
            time: slot.start_time,
            available: slot.status === 'available'
          }));
        }
        return [];
      } catch (error) {
        console.error('❌ Failed to load slots:', error);
        return [];
      }
    },

    // Create a new booking
    createBooking: async (bookingData) => {
      try {
        const response = await fetch(`${API_URL}/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingData)
        });
        return await handleResponse(response);
      } catch (error) {
        console.error('❌ Failed to create booking:', error);
        throw error;
      }
    },

    // Create Razorpay payment order
    createPaymentOrder: async (bookingData) => {
      try {
        const response = await fetch(`${API_URL}/payment/order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingData)
        });
        return await handleResponse(response);
      } catch (error) {
        console.error('❌ Failed to create payment order:', error);
        throw error;
      }
    },

    // Verify payment and confirm booking
    verifyPayment: async (paymentData) => {
      try {
        const response = await fetch(`${API_URL}/payment/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentData)
        });
        return await handleResponse(response);
      } catch (error) {
        console.error('❌ Failed to verify payment:', error);
        throw error;
      }
    },

    // Get booking details
    getBooking: async (bookingCode) => {
      try {
        const response = await fetch(`${API_URL}/bookings/${bookingCode}`);
        return await handleResponse(response);
      } catch (error) {
        console.error('❌ Failed to get booking:', error);
        throw error;
      }
    },

    // Check API health
    healthCheck: async () => {
      try {
        const response = await fetch(`${API_URL}/psychologists`);
        return response.ok;
      } catch {
        return false;
      }
    }
  };

  // Auto-load psychologists when page loads (if not demo mode)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      loadPsychologistsFromAPI();
    });
  } else {
    loadPsychologistsFromAPI();
  }

  async function loadPsychologistsFromAPI() {
    try {
      const pros = await window.MENTRA_API.getPsychologists();
      if (pros.length > 0) {
        window.MENTRA_PSYCHOLOGISTS = pros;
        console.log(`✅ Loaded ${pros.length} psychologists from backend API`);

        // Trigger any page-specific initialization
        if (window.initPage) window.initPage();
        if (window.onPsychologistsLoaded) window.onPsychologistsLoaded(pros);
      }
    } catch (error) {
      console.error('❌ Failed to load psychologists from API:', error);
      console.log('⚠️  Using demo mode with hard-coded psychologists');
    }
  }

})();
