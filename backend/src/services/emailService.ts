import 'dotenv/config';
import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const emailFrom = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'onboarding@resend.dev';

if (resend) {
  console.log('📧 Email Service: Configured Resend HTTP API client');
} else {
  console.log('📧 Email Service: No RESEND_API_KEY provided — running in offline console log mode');
}

interface NotificationDetails {
  studentName: string;
  studentEmail: string;
  lecturerName: string;
  lecturerEmail: string;
  date: string;
  startTime: string;
  endTime: string;
}

function getKnustHtmlTemplate(title: string, contentHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #006837 0%, #004d28 100%); color: #ffffff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { margin: 4px 0 0 0; font-size: 13px; color: #facc15; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
    .content { padding: 28px 24px; }
    .card { background: #f8fafc; border-left: 4px solid #006837; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .card-row { display: flex; margin-bottom: 8px; font-size: 14px; }
    .card-row:last-child { margin-bottom: 0; }
    .card-label { font-weight: 600; width: 100px; color: #64748b; }
    .card-value { color: #0f172a; font-weight: 500; }
    .badge-pending { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-approved { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-rejected { display: inline-block; background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .footer { background: #f1f5f9; text-align: center; padding: 16px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>KNUST Consult</h1>
      <p>Academic Appointment System</p>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Kwame Nkrumah University of Science and Technology. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;
}

async function sendMail(to: string | string[], subject: string, text: string, html?: string): Promise<void> {
  const emailHtml = html || text.replace(/\n/g, '<br>');

  if (!resend) {
    const recipients = Array.isArray(to) ? to.join(', ') : to;
    console.log('\n✉️  [OFFLINE EMAIL LOG]');
    console.log(`TO      : ${recipients}`);
    console.log(`SUBJECT : ${subject}`);
    console.log(`BODY    :\n${text.trim()}`);
    console.log('---------------------------------------------------\n');
    return;
  }

  try {
    const data = await resend.emails.send({
      from: emailFrom,
      to,
      subject,
      html: emailHtml,
    });

    const recipients = Array.isArray(to) ? to.join(' & ') : to;
    console.log(`✅ Email sent via Resend to ${recipients} (ID: ${data.data?.id || 'success'})`);
  } catch (err: any) {
    console.error('⚠️ Failed to send email via Resend, logging fallback:', err?.message || err);
    console.log(`[OFFLINE FALLBACK] ${subject} -> ${Array.isArray(to) ? to.join(', ') : to}`);
  }
}

export const emailService = {
  /**
   * Sent to the LECTURER when a student submits a booking request (PENDING state).
   */
  async sendBookingRequest(details: NotificationDetails): Promise<void> {
    const subject = `[KnustConsult] New Appointment Request — ${details.studentName}`;
    const text = `Hello ${details.lecturerName},\n\nA student has submitted an appointment request that requires your approval.\n\nRequest Details:\n- Student: ${details.studentName} (${details.studentEmail})\n- Date: ${details.date}\n- Time: ${details.startTime} - ${details.endTime}\n\nPlease log in to KnustConsult to approve or decline.`;
    
    const html = getKnustHtmlTemplate(
      subject,
      `
      <h2>New Appointment Request <span class="badge-pending">Pending Approval</span></h2>
      <p>Hello <strong>${details.lecturerName}</strong>,</p>
      <p>A student has requested a consultation session with you. Please review the details below:</p>
      
      <div class="card">
        <div class="card-row"><span class="card-label">Student:</span><span class="card-value">${details.studentName} (${details.studentEmail})</span></div>
        <div class="card-row"><span class="card-label">Date:</span><span class="card-value">${details.date}</span></div>
        <div class="card-row"><span class="card-label">Time:</span><span class="card-value">${details.startTime} - ${details.endTime}</span></div>
      </div>

      <p>Log in to your <strong>KnustConsult Lecturer Dashboard</strong> to respond to this request.</p>
      `
    );

    await sendMail(details.lecturerEmail, subject, text, html);
  },

  /**
   * Sent to the STUDENT when their booking request is approved by the lecturer.
   */
  async sendBookingApproved(details: NotificationDetails): Promise<void> {
    const subject = `[KnustConsult] Appointment Confirmed — ${details.lecturerName}`;
    const text = `Hello ${details.studentName},\n\nGreat news! Your appointment request has been approved.\n\nDetails:\n- Lecturer: ${details.lecturerName} (${details.lecturerEmail})\n- Date: ${details.date}\n- Time: ${details.startTime} - ${details.endTime}\n\nPlease be on time.`;

    const html = getKnustHtmlTemplate(
      subject,
      `
      <h2>Appointment Confirmed <span class="badge-approved">Approved</span></h2>
      <p>Hello <strong>${details.studentName}</strong>,</p>
      <p>Your consultation request has been approved by your lecturer!</p>
      
      <div class="card">
        <div class="card-row"><span class="card-label">Lecturer:</span><span class="card-value">${details.lecturerName} (${details.lecturerEmail})</span></div>
        <div class="card-row"><span class="card-label">Date:</span><span class="card-value">${details.date}</span></div>
        <div class="card-row"><span class="card-label">Time:</span><span class="card-value">${details.startTime} - ${details.endTime}</span></div>
      </div>

      <p>Please make sure to arrive on time for your session. Visit the student portal if you need to manage your bookings.</p>
      `
    );

    await sendMail(details.studentEmail, subject, text, html);
  },

  /**
   * Sent to the STUDENT when their booking request is rejected by the lecturer.
   */
  async sendBookingRejected(details: NotificationDetails): Promise<void> {
    const subject = `[KnustConsult] Appointment Request Declined`;
    const text = `Hello ${details.studentName},\n\nUnfortunately, your appointment request with ${details.lecturerName} was declined.\n\nDetails:\n- Date: ${details.date}\n- Time: ${details.startTime} - ${details.endTime}\n\nThe slot has been reopened. You may request another available time slot.`;

    const html = getKnustHtmlTemplate(
      subject,
      `
      <h2>Appointment Declined <span class="badge-rejected">Declined</span></h2>
      <p>Hello <strong>${details.studentName}</strong>,</p>
      <p>Regrettably, your requested appointment with <strong>${details.lecturerName}</strong> could not be accepted at this time.</p>
      
      <div class="card">
        <div class="card-row"><span class="card-label">Lecturer:</span><span class="card-value">${details.lecturerName}</span></div>
        <div class="card-row"><span class="card-label">Date:</span><span class="card-value">${details.date}</span></div>
        <div class="card-row"><span class="card-label">Time:</span><span class="card-value">${details.startTime} - ${details.endTime}</span></div>
      </div>

      <p>You can browse other available office hours on your student dashboard to submit a new request.</p>
      `
    );

    await sendMail(details.studentEmail, subject, text, html);
  },

  /**
   * Sent to both parties when a CONFIRMED booking is cancelled.
   */
  async sendBookingCancellation(
    details: NotificationDetails,
    cancelledByRole: 'STUDENT' | 'LECTURER'
  ): Promise<void> {
    const subject = `[KnustConsult] Consultation Cancelled: ${details.date}`;
    const text = `Hello,\n\nThe consultation scheduled for ${details.date} between ${details.lecturerName} and ${details.studentName} has been CANCELLED by the ${cancelledByRole.toLowerCase()}.\n\nDetails:\n- Date: ${details.date}\n- Time: ${details.startTime} - ${details.endTime}`;

    const html = getKnustHtmlTemplate(
      subject,
      `
      <h2>Consultation Cancelled <span class="badge-rejected">Cancelled</span></h2>
      <p>Notice: The following scheduled consultation session has been <strong>cancelled by the ${cancelledByRole.toLowerCase()}</strong>.</p>
      
      <div class="card">
        <div class="card-row"><span class="card-label">Lecturer:</span><span class="card-value">${details.lecturerName} (${details.lecturerEmail})</span></div>
        <div class="card-row"><span class="card-label">Student:</span><span class="card-value">${details.studentName} (${details.studentEmail})</span></div>
        <div class="card-row"><span class="card-label">Date:</span><span class="card-value">${details.date}</span></div>
        <div class="card-row"><span class="card-label">Time:</span><span class="card-value">${details.startTime} - ${details.endTime}</span></div>
      </div>

      <p>If you need to reschedule, please visit the KnustConsult portal.</p>
      `
    );

    await sendMail([details.studentEmail, details.lecturerEmail], subject, text, html);
  },

  /** @deprecated Use sendBookingApproved instead */
  async sendBookingConfirmation(details: NotificationDetails): Promise<void> {
    return this.sendBookingApproved(details);
  },
};

