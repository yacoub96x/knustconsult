import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || 'noreply@knust.edu.gh';

let transporter: nodemailer.Transporter | null = null;

if (smtpHost && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
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

async function sendMail(to: string | string[], subject: string, text: string): Promise<void> {
  if (!transporter) {
    const recipients = Array.isArray(to) ? to.join(', ') : to;
    console.log('\n✉️  [OFFLINE EMAIL LOG]');
    console.log(`TO      : ${recipients}`);
    console.log(`SUBJECT : ${subject}`);
    console.log(`BODY    :\n${text.trim()}`);
    console.log('---------------------------------------------------\n');
    return;
  }

  try {
    await transporter.sendMail({ from: smtpFrom, to, subject, text });
    const recipients = Array.isArray(to) ? to.join(' & ') : to;
    console.log(`✅ Email sent to ${recipients}`);
  } catch (err) {
    console.error('⚠️ Failed to send email, logging instead:', err);
    console.log(`[OFFLINE FALLBACK] ${subject}`);
  }
}

export const emailService = {
  /**
   * Sent to the LECTURER when a student submits a booking request (PENDING state).
   */
  async sendBookingRequest(details: NotificationDetails): Promise<void> {
    const subject = `[KnustConsult] New Appointment Request — Action Required`;
    const text = `
Hello ${details.lecturerName},

A student has submitted an appointment request that requires your approval.

Request Details:
- Student : ${details.studentName} (${details.studentEmail})
- Date    : ${details.date}
- Time    : ${details.startTime} - ${details.endTime}

Please log in to KnustConsult to approve or decline this request.

Best regards,
KnustConsult Academic System
`;
    await sendMail(details.lecturerEmail, subject, text);
  },

  /**
   * Sent to the STUDENT when their booking request is approved by the lecturer.
   */
  async sendBookingApproved(details: NotificationDetails): Promise<void> {
    const subject = `[KnustConsult] Appointment Confirmed — ${details.lecturerName}`;
    const text = `
Hello ${details.studentName},

Great news! Your appointment request has been approved.

Appointment Details:
- Lecturer : ${details.lecturerName} (${details.lecturerEmail})
- Date     : ${details.date}
- Time     : ${details.startTime} - ${details.endTime}

Please be on time. Visit KnustConsult if you need to cancel.

Best regards,
KnustConsult Academic System
`;
    await sendMail(details.studentEmail, subject, text);
  },

  /**
   * Sent to the STUDENT when their booking request is rejected by the lecturer.
   */
  async sendBookingRejected(details: NotificationDetails): Promise<void> {
    const subject = `[KnustConsult] Appointment Request Declined`;
    const text = `
Hello ${details.studentName},

Unfortunately, your appointment request with ${details.lecturerName} has been declined.

Requested Details:
- Date : ${details.date}
- Time : ${details.startTime} - ${details.endTime}

The slot is now open again — you are welcome to request another available time on KnustConsult.

Best regards,
KnustConsult Academic System
`;
    await sendMail(details.studentEmail, subject, text);
  },

  /**
   * Sent to both parties when a CONFIRMED booking is cancelled.
   */
  async sendBookingCancellation(
    details: NotificationDetails,
    cancelledByRole: 'STUDENT' | 'LECTURER'
  ): Promise<void> {
    const subject = `[KnustConsult] Consultation Cancelled: ${details.date} (${details.startTime} - ${details.endTime})`;
    const text = `
Hello,

The consultation session scheduled for ${details.date} between ${details.lecturerName} and ${details.studentName} has been CANCELLED by the ${cancelledByRole.toLowerCase()}.

Session Details:
- Lecturer : ${details.lecturerName} (${details.lecturerEmail})
- Student  : ${details.studentName} (${details.studentEmail})
- Date     : ${details.date}
- Time     : ${details.startTime} - ${details.endTime}

If this was a mistake or you need to reschedule, please visit the KnustConsult portal.

Best regards,
KnustConsult Academic System
`;
    await sendMail([details.studentEmail, details.lecturerEmail], subject, text);
  },

  /** @deprecated Use sendBookingApproved instead — kept for backward compatibility */
  async sendBookingConfirmation(details: NotificationDetails): Promise<void> {
    return this.sendBookingApproved(details);
  },
};
