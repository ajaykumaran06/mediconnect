const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || 'noreply@mediconnect.health';

/**
 * Send appointment confirmation email
 */
const sendAppointmentEmail = async (toEmail, appointment) => {
  if (!process.env.RESEND_API_KEY) return;

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: 'MediConnect — Appointment Confirmed',
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #0b8a7a;">Appointment Confirmed</h2>
        <p>Your appointment has been successfully booked.</p>
        <table style="width:100%; border-collapse:collapse; margin-top:16px;">
          <tr><td style="padding:8px 0; color:#666;">Date</td><td><strong>${appointment.date}</strong></td></tr>
          <tr><td style="padding:8px 0; color:#666;">Time</td><td><strong>${appointment.time}</strong></td></tr>
          <tr><td style="padding:8px 0; color:#666;">Status</td><td><strong>${appointment.status}</strong></td></tr>
        </table>
        <p style="margin-top:24px; color:#666; font-size:13px;">
          You can manage your appointment from your MediConnect dashboard.
        </p>
        <p style="color:#999; font-size:11px;">MediConnect — Rural Health Access Platform</p>
      </div>
    `,
  });
};

/**
 * Send doctor approval email
 */
const sendDoctorApprovalEmail = async (toEmail, doctorName, approved) => {
  if (!process.env.RESEND_API_KEY) return;

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `MediConnect — Account ${approved ? 'Approved' : 'Update'}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #0b8a7a;">Hello Dr. ${doctorName},</h2>
        <p>${approved
        ? 'Your MediConnect doctor account has been approved. You can now log in and start accepting patient appointments.'
        : 'Your account application requires additional review. Our team will be in touch.'
      }</p>
        <p style="color:#999; font-size:11px;">MediConnect — Rural Health Access Platform</p>
      </div>
    `,
  });
};

module.exports = { sendAppointmentEmail, sendDoctorApprovalEmail };
