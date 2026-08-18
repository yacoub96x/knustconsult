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

export const emailService = {
  async sendBookingConfirmation(details: NotificationDetails): Promise<void> {
    const subject = `[KnustConsult] Consultation Confirmed: ${details.lecturerName} & ${details.studentName}`;
    const textContent = `
Hello,

A consultation session has been successfully booked.

Session Details:
- Lecturer: ${details.lecturerName} (${details.lecturerEmail})
- Student: ${details.studentName} (${details.studentEmail})
- Date: ${details.date}
- Time: ${details.startTime} - ${details.endTime}

Best regards,
KnustConsult Academic System
`;

    if (!transporter) {
      console.log('\n✉️  [OFFLINE EMAIL LOG - BOOKING CONFIRMATION]');
      console.log(`TO (Student) : ${details.studentEmail}`);
      console.log(`TO (Lecturer): ${details.lecturerEmail}`);
      console.log(`SUBJECT      : ${subject}`);
      console.log(`BODY         :\n${textContent.trim()}`);
      console.log('---------------------------------------------------\n');
      return;
    }

    try {
      await transporter.sendMail({
        from: smtpFrom,
        to: [details.studentEmail, details.lecturerEmail],
        subject,
        text: textContent,
      });
      console.log(`✅ Confirmation email sent to ${details.studentEmail} & ${details.lecturerEmail}`);
    } catch (err) {
      console.error('⚠️ Failed to send confirmation email, logging instead:', err);
      console.log(`[OFFLINE FALLBACK] ${subject} for ${details.studentEmail}`);
    }
  },

  async sendBookingCancellation(
    details: NotificationDetails,
    cancelledByRole: 'STUDENT' | 'LECTURER'
  ): Promise<void> {
    const subject = `[KnustConsult] Consultation Cancelled: ${details.date} (${details.startTime} - ${details.endTime})`;
    const textContent = `
Hello,

The consultation session scheduled for ${details.date} between ${details.lecturerName} and ${details.studentName} has been CANCELLED by the ${cancelledByRole.toLowerCase()}.

Session Details:
- Lecturer: ${details.lecturerName} (${details.lecturerEmail})
- Student: ${details.studentName} (${details.studentEmail})
- Date: ${details.date}
- Time: ${details.startTime} - ${details.endTime}

If this was a mistake or you need to reschedule, please visit the KnustConsult portal.

Best regards,
KnustConsult Academic System
`;

    if (!transporter) {
      console.log('\n✉️  [OFFLINE EMAIL LOG - BOOKING CANCELLATION]');
      console.log(`TO (Student) : ${details.studentEmail}`);
      console.log(`TO (Lecturer): ${details.lecturerEmail}`);
      console.log(`SUBJECT      : ${subject}`);
      console.log(`BODY         :\n${textContent.trim()}`);
      console.log('---------------------------------------------------\n');
      return;
    }

    try {
      await transporter.sendMail({
        from: smtpFrom,
        to: [details.studentEmail, details.lecturerEmail],
        subject,
        text: textContent,
      });
      console.log(`✅ Cancellation email sent to ${details.studentEmail} & ${details.lecturerEmail}`);
    } catch (err) {
      console.error('⚠️ Failed to send cancellation email, logging instead:', err);
      console.log(`[OFFLINE FALLBACK] ${subject} for ${details.studentEmail}`);
    }
  },
};
