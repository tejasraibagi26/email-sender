import nodemailer from 'nodemailer';
import supabase from './supabase.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendEmail({ to, subject, html, text, jobId = null }) {
  try {
    await transporter.sendMail({
      from: `"Email Service" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    });

    await supabase.from('email_logs').insert({
      job_id: jobId,
      recipient: to,
      subject,
      status: 'sent',
    });
  } catch (err) {
    await supabase.from('email_logs').insert({
      job_id: jobId,
      recipient: to,
      subject,
      status: 'failed',
      error: err.message,
    });
    throw err;
  }
}
