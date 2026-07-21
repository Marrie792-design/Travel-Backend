const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(express.json());

app.use(cors({
  origin: [
    'https://travel-frontend-nu-gilt.vercel.app', // Aapka live frontend URL
    'http://localhost:5173'
  ],
  credentials: true
}));


// Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Connection test check
transporter.verify((error) => {
  if (error) {
    console.error('Email service connection failed:', error);
  } else {
    console.log('Server is ready to send emails');
  }
});


// ----------------------------------------------------
// 1. API Route for Reservation Inquiry
// ----------------------------------------------------
app.post('/api/reserve', async (req, res) => {
  const { assetTitle, startDate, endDate, fullName, email, phone, totalPrice } = req.body;


  const mailOptions = {
  from: `"VIP Concierge System" <${process.env.EMAIL_USER}>`,
  
  // Note: Agar yeh Admin ko bhej rahe hain toh sahi hai. 
  // Agar Client (User) ko bhejna hai toh yahan `to: email` aayega.
  to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER, 
  
  // 1. Emoji (🚨) hataya hai kyun ke spam filters warning emojis ko spam samajhte hain
  subject: `New Reservation Request: ${assetTitle}`, 

  // 2. Plain Text Fallback (Spam score drastically kam karta hai)
  text: `New Reservation Request for ${assetTitle}\nClient Name: ${fullName}\nEmail: ${email}\nPhone: ${phone}\nDates: ${startDate} to ${endDate}\nTotal: $${totalPrice} USD`,

  // 3. HTML Version
  html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #c5a059; border-radius: 10px; max-width: 600px; color: #333333;">
      <h2 style="color: #0f172a; border-bottom: 2px solid #c5a059; padding-bottom: 10px; margin-top: 0;">New Reservation Request</h2>
      <p style="margin: 8px 0;"><strong>Asset:</strong> ${assetTitle}</p>
      <p style="margin: 8px 0;"><strong>Client Name:</strong> ${fullName}</p>
      <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
      <p style="margin: 8px 0;"><strong>Phone:</strong> ${phone}</p>
      <p style="margin: 8px 0;"><strong>Start Date:</strong> ${startDate}</p>
      <p style="margin: 8px 0;"><strong>End Date:</strong> ${endDate}</p>
      <p style="margin: 8px 0;"><strong>Estimated Total Price:</strong> $${totalPrice} USD</p>
    </div>
  `
};


  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Email Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send email.' });
  }
});

// ----------------------------------------------------
// 2. API Route for Schedule Call Request
// ----------------------------------------------------
app.post('/api/schedule-call', async (req, res) => {
  const { assetTitle, phone, callDate, callTime, callType } = req.body;

  const mailOptions = {
    from: `"VIP Concierge System" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: `📞 New Concierge Call Request for ${assetTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #c5a059; border-radius: 10px; max-width: 600px;">
        <h2 style="color: #0f172a; border-bottom: 2px solid #c5a059; padding-bottom: 10px;">New Call Schedule</h2>
        <p><strong>Asset:</strong> ${assetTitle}</p>
        <p><strong>Client Phone:</strong> ${phone}</p>
        <p><strong>Scheduled Date:</strong> ${callDate}</p>
        <p><strong>Scheduled Time:</strong> ${callTime}</p>
        <p><strong>Preferred Channel:</strong> ${callType === 'phone' ? 'Direct Phone Call' : 'Encrypted WhatsApp'}</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Call schedule email sent successfully!' });
  } catch (error) {
    console.error('Email Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send email.' });
  }
});

// ----------------------------------------------------
// 3. API Route for Newsletter
// ----------------------------------------------------
app.post('/api/newsletter', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: '📩 New Newsletter Subscription!',
      html: `
        <h2>New Newsletter Subscriber</h2>
        <p><b>User Email:</b> ${email}</p>
        <p><i>Subscribed from website.</i></p>
      `,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Our Newsletter!',
      html: `
        <h2>Thank you for subscribing!</h2>
        <p>You will now receive our latest updates and expert advice.</p>
      `,
    });

    return res.status(200).json({ success: true, message: 'Subscribed successfully!' });
  } catch (error) {
    console.error('Newsletter API Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send email' });
  }
});

// ----------------------------------------------------
// 4. API Route for Contact / Call Back
// ----------------------------------------------------
app.post('/api/contact', async (req, res) => {
  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and phone are required' });
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: '📞 New Call Back Request!',
      html: `
        <h2>Call Back Request Details</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Phone:</b> ${phone}</p>
      `,
    });

    return res.status(200).json({ success: true, message: 'Request sent successfully!' });
  } catch (error) {
    console.error('Contact API Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// ----------------------------------------------------
// 5. API Route: Luxury Blueprint Email Deploy
// ----------------------------------------------------
app.post('/api/deploy-blueprint', async (req, res) => {
  const {
    guestName,
    guestEmail,
    guestPhone,
    noOfPeople,
    departureCountry,
    destinationCountry,
    flightClass,
    roomType,
    noOfRooms,
    nights,
    selectedPlaces,
    selectedHotel,
    selectedMenu,
    selectedActivities,
    totalPrice,
    promoCode,        // Added Promo Code
    appliedDiscount   // Added Discount Percentage
  } = req.body;

  // 1. Admin KO Detailed Mail
  const adminMailOptions = {
    from: `"VIP Blueprint System" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: `💎 NEW BLUEPRINT DEPLOYED: ${guestName} (${destinationCountry})`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 25px; border: 2px solid #c5a059; border-radius: 12px; max-width: 650px; background-color: #0f172a; color: #ffffff;">
        <h2 style="color: #c5a059; margin-top: 0; border-bottom: 2px solid #c5a059; padding-bottom: 10px;">💎 New VIP Blueprint Deployed</h2>
        
        <p><strong>Lead Guest:</strong> ${guestName}</p>
        <p><strong>Email:</strong> ${guestEmail} | <strong>Phone:</strong> ${guestPhone}</p>
        <p><strong>Party Size:</strong> ${noOfPeople} Guest(s)</p>
        <hr style="border-color: #334155;" />

        <p><strong>Routing Origin:</strong> ${departureCountry} ✈️ <strong>Target:</strong> ${destinationCountry}</p>
        <p><strong>Air Corridor:</strong> ${flightClass?.toUpperCase()}</p>
        <p><strong>Lodging:</strong> ${selectedHotel} (${roomType === 'luxury' ? 'Luxury Suite' : 'Standard Room'}) x ${noOfRooms} Room(s) for ${nights} Night(s)</p>
        <p><strong>Dining Choice:</strong> ${selectedMenu || 'None'}</p>
        <hr style="border-color: #334155;" />

        <p><strong>Landmarks Selected:</strong> ${Array.isArray(selectedPlaces) ? selectedPlaces.join(', ') : 'None'}</p>
        <p><strong>Signature Activities:</strong> ${Array.isArray(selectedActivities) ? selectedActivities.join(', ') : 'None'}</p>
        
        ${promoCode ? `<p style="color: #22c55e;"><strong>Voucher Applied:</strong> ${promoCode} (${appliedDiscount}% OFF)</p>` : ''}

        <h3 style="color: #c5a059; border-top: 1px solid #c5a059; padding-top: 10px; margin-bottom: 0;">Grand Total Invoice: $${totalPrice?.toLocaleString()} USD</h3>
      </div>
    `
  };

  // 2. User KO Confirmation Mail
  const userMailOptions = {
    from: `"VIP Concierge Team" <${process.env.EMAIL_USER}>`,
    to: guestEmail,
    subject: `✨ Your Luxury Blueprint to ${destinationCountry} is Locked!`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; max-width: 600px;">
        <h2 style="color: #0f172a;">Dear ${guestName},</h2>
        <p>Thank you for submitting your custom luxury blueprint to <strong>${destinationCountry}</strong>.</p>
        <p style="font-size: 16px; color: #166534; font-weight: bold;">We will contact you soon!</p>
        <p>Our VIP Concierge Specialist will review your request and reach out via phone (${guestPhone}) or email shortly.</p>
        <br />
        <p>Best Regards,</p>
        <p><strong>VIP Concierge Team</strong></p>
      </div>
    `
  };

  try {
    await transporter.sendMail(adminMailOptions);
    if (guestEmail) await transporter.sendMail(userMailOptions);
    return res.status(200).json({ success: true, message: 'We will contact you soon' });
  } catch (error) {
    console.error('Email Deploy Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to deploy blueprint' });
  }
});



app.post('/api/send-reservation', async (req, res) => {
  try {
    // 1. Client Details Extracted
    const name = req.body.name || req.body.fullName || req.body.guestName;
    const email = req.body.email || req.body.guestEmail;
    const phone = req.body.phone || req.body.guestPhone || 'N/A';

    // 🛑 VALIDATION: Agar user details missing hain toh email trigger na karein
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Name and Email are required to submit a booking.'
      });
    }

    // 2. Dynamic Trip Details
    const bookingType = req.body.bookingType || req.body.type || 'General Reservation';
    const title = req.body.title || req.body.assetTitle || req.body.packageName || 'Trip Booking';
    const country = req.body.country || req.body.destinationCountry || '';
    const place = req.body.place || req.body.selectedPlace || '';
    
    // Date handling fixed (Avoids duplicate Departure & Trip Date rows)
    const departureDate = req.body.departureDate || '';
    const startDate = req.body.startDate || req.body.tripDate || '';
    
    const preferredTime = req.body.preferredTime || req.body.tripTime || '';
    const duration = req.body.duration || '';
    const pricePerPerson = req.body.pricePerPerson || '';
    const totalPrice = req.body.totalPrice || req.body.price || 'N/A';
    const description = req.body.description || req.body.desc || '';
    const itinerary = req.body.itinerary || [];
    const menuInfo = req.body.menuInfo || req.body.selectedMenu || '';
    const activities = req.body.activities || req.body.selectedActivities || '';
    const numPeople = req.body.numPeople || req.body.noOfPeople || 1;

    // 3. Itinerary List HTML Generator
    let itineraryHtml = '';
    if (Array.isArray(itinerary) && itinerary.length > 0) {
      itineraryHtml = `
        <div style="margin-top: 15px; padding: 12px; background-color: #f8fafc; border-radius: 6px;">
          <strong style="color: #0f172a;">Detailed Itinerary:</strong>
          <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #475569;">
            ${itinerary.map((day, idx) => `<li><strong>Day ${idx + 1}:</strong> ${day}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    // 4. Mail Options Setup
    const mailOptions = {
      from: `"Nova Trails Reservations" <${process.env.EMAIL_USER}>`,
      replyTo: email,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `📌 New Booking Alert [${bookingType}]: ${title}`,
      text: `New Booking Request!\nType: ${bookingType}\nTitle: ${title}\nName: ${name}\nEmail: ${email}\nPhone: ${phone}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; background-color: #ffffff; color: #1e293b;">
          
          <!-- Header -->
          <div style="border-bottom: 2px solid #c5a059; padding-bottom: 12px; margin-bottom: 20px;">
            <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: bold;">Reservation Notification</span>
            <h2 style="margin: 5px 0 0 0; color: #0f172a;">${title}</h2>
            <span style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 11px; padding: 3px 8px; border-radius: 4px; margin-top: 8px;">${bookingType}</span>
          </div>

          <!-- Trip Details -->
          <h3 style="color: #334155; font-size: 16px; margin-bottom: 12px;">Trip Overview</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 15px;">
            ${country ? `<tr><td style="padding: 6px 0; color: #64748b; width: 140px;">Country:</td><td style="padding: 6px 0; font-weight: bold;">${country}</td></tr>` : ''}
            ${place ? `<tr><td style="padding: 6px 0; color: #64748b;">Hub / Region:</td><td style="padding: 6px 0; font-weight: bold;">${place}</td></tr>` : ''}
            ${departureDate ? `<tr><td style="padding: 6px 0; color: #64748b;">Departure Date:</td><td style="padding: 6px 0; font-weight: bold;">${departureDate}</td></tr>` : ''}
            ${(startDate && startDate !== departureDate) ? `<tr><td style="padding: 6px 0; color: #64748b;">Trip Date:</td><td style="padding: 6px 0; font-weight: bold;">${startDate}</td></tr>` : ''}
            ${preferredTime ? `<tr><td style="padding: 6px 0; color: #64748b;">Slot Time:</td><td style="padding: 6px 0; font-weight: bold;">${preferredTime}</td></tr>` : ''}
            ${duration ? `<tr><td style="padding: 6px 0; color: #64748b;">Duration:</td><td style="padding: 6px 0; font-weight: bold;">${duration}</td></tr>` : ''}
            ${numPeople ? `<tr><td style="padding: 6px 0; color: #64748b;">Total Guests:</td><td style="padding: 6px 0; font-weight: bold;">${numPeople} Person(s)</td></tr>` : ''}
            ${pricePerPerson ? `<tr><td style="padding: 6px 0; color: #64748b;">Base Price:</td><td style="padding: 6px 0; font-weight: bold;">${pricePerPerson} / person</td></tr>` : ''}
            ${totalPrice ? `<tr><td style="padding: 6px 0; color: #64748b;">Calculated Total:</td><td style="padding: 6px 0; font-weight: bold; color: #16a34a; font-size: 16px;">${totalPrice}</td></tr>` : ''}
          </table>

          ${description ? `<p style="font-size: 13px; color: #475569; background: #f1f5f9; padding: 10px; border-radius: 6px;"><strong>Summary:</strong> ${description}</p>` : ''}
          ${menuInfo ? `<p style="font-size: 13px; color: #475569; background: #f1f5f9; padding: 10px; border-radius: 6px;"><strong>Gourmet Menu:</strong> ${menuInfo}</p>` : ''}
          ${activities ? `<p style="font-size: 13px; color: #475569; background: #f1f5f9; padding: 10px; border-radius: 6px;"><strong>Activities:</strong> ${activities}</p>` : ''}
          ${itineraryHtml}

          <hr style="margin: 25px 0 15px 0; border: 0; border-top: 1px solid #e2e8f0;" />

          <!-- Customer Details -->
          <h3 style="color: #334155; font-size: 16px; margin-bottom: 12px;">Client Details</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 4px 0; color: #64748b; width: 140px;">Full Name:</td><td style="padding: 4px 0; font-weight: bold;">${name}</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Email Address:</td><td style="padding: 4px 0; font-weight: bold;"><a href="mailto:${email}" style="color: #2563eb;">${email}</a></td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Phone Number:</td><td style="padding: 4px 0; font-weight: bold;">${phone}</td></tr>
          </table>

        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Reservation Email Sent Successfully:', info.response);
    res.status(200).json({ success: true, message: 'Reservation details emailed successfully' });

  } catch (error) {
    console.error('❌ Nodemailer Reservation Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});



// Test Route (Health Check)
app.get('/', (req, res) => {
  res.send('Travel Backend API is Running Successfully!');
});


// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app; // Vercel serverless functions ke liye