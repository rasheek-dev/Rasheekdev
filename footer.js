/* MENTRA footer: fills in the year and the contact details from config.js. Anything left empty there is simply not shown. */
(function () {
  var C = window.MENTRA_CONFIG || {};
  var wa = String(C.WHATSAPP_NUMBER || '').replace(/\D/g, '');
  [].forEach.call(document.querySelectorAll('[data-year]'), function (e) { e.textContent = new Date().getFullYear(); });
  [].forEach.call(document.querySelectorAll('.ftr [data-contact]'), function (el) {
    var k = el.getAttribute('data-contact'), v = k === 'email' ? C.CONTACT_EMAIL : k === 'phone' ? C.CONTACT_PHONE : k === 'whatsapp' ? wa : C.ADDRESS;
    if (!v) { el.hidden = true; return; }
    var a = el.querySelector('a'), t = el.querySelector('[data-val]');
    if (k === 'email' && a) { a.href = 'mailto:' + v; a.textContent = v; }
    else if (k === 'phone' && a) { a.href = 'tel:' + String(v).replace(/[^\d+]/g, ''); a.textContent = v; }
    else if (k === 'whatsapp' && a) { a.href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent('Hello Mentra, I would like some information.'); a.textContent = 'Message us on WhatsApp'; }
    else if (t) t.textContent = v;
  });
})();
