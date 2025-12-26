/**
 * Email/SMS Communication Service
 * 
 * Provides email and SMS notification capabilities with:
 * - Template-based messaging
 * - Queue system for async sending
 * - Error handling and retry logic
 * - Integration with email (SendGrid/AWS SES) and SMS (Twilio) providers
 */

import { Pool } from 'pg';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Email template types
 */
export enum EmailTemplate {
  REGISTRATION = 'registration',
  PASSWORD_RESET = 'password_reset',
  BOOKING_CONFIRMATION = 'booking_confirmation',
  BOOKING_REMINDER = 'booking_reminder',
  FEATURED_PURCHASE = 'featured_purchase',
  FEATURED_APPROVED = 'featured_approved',
  REVIEW_APPROVED = 'review_approved',
  REVIEW_REJECTED = 'review_rejected',
  WELCOME = 'welcome',
}

/**
 * SMS template types
 */
export enum SmsTemplate {
  BOOKING_REMINDER = 'booking_reminder',
  BOOKING_CANCELLED = 'booking_cancelled',
  URGENT_NOTIFICATION = 'urgent_notification',
  VERIFICATION_CODE = 'verification_code',
}

/**
 * Email provider types
 */
export enum EmailProvider {
  SENDGRID = 'sendgrid',
  AWS_SES = 'aws_ses',
}

/**
 * SMS provider types
 */
export enum SmsProvider {
  TWILIO = 'twilio',
}

/**
 * Email message interface
 */
export interface EmailMessage {
  to: string;
  subject: string;
  template: EmailTemplate;
  data?: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * SMS message interface
 */
export interface SmsMessage {
  to: string;
  template: SmsTemplate;
  data?: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Email template data interface
 */
export interface EmailTemplateData {
  userName?: string;
  userEmail?: string;
  trainerName?: string;
  bookingDate?: string;
  bookingTime?: string;
  bookingId?: string;
  resetLink?: string;
  verificationCode?: string;
  featuredDuration?: number;
  featuredCouncil?: string;
  reviewComment?: string;
  rejectionReason?: string;
}

/**
 * SMS template data interface
 */
export interface SmsTemplateData {
  userName?: string;
  bookingDate?: string;
  bookingTime?: string;
  trainerName?: string;
  verificationCode?: string;
  urgentMessage?: string;
}

/**
 * Send result interface
 */
export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: EmailProvider | SmsProvider;
  retryCount?: number;
}

/**
 * Queue item interface
 */
export interface QueueItem {
  id: string;
  type: 'email' | 'sms';
  message: EmailMessage | SmsMessage;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: Date;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  error?: string;
  createdAt: Date;
  sentAt?: Date;
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * Email templates
 * HTML templates for different email types
 */
const emailTemplates: Record<EmailTemplate, (data: EmailTemplateData) => { subject: string; html: string; text: string }> = {
  [EmailTemplate.REGISTRATION]: (data) => ({
    subject: 'Welcome to Dog Trainers Directory',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Dog Trainers Directory</title>
        </head>
        <body style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0A0A0A; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="background: #FFFFFF; border-radius: 12px; padding: 32px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
              <h1 style="color: #2563EB; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">Welcome to Dog Trainers Directory!</h1>
              <p style="font-size: 16px; margin: 0 0 16px 0;">Hi ${data.userName || 'there'},</p>
              <p style="font-size: 16px; margin: 0 0 16px 0;">Thank you for registering with Dog Trainers Directory. Your account has been successfully created.</p>
              <div style="margin: 32px 0;">
                <a href="${process.env.APP_URL || 'https://dogtrainersdirectory.com.au'}" style="display: inline-block; background: #2563EB; color: #FFFFFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 16px;">Get Started</a>
              </div>
              <p style="font-size: 14px; color: #64748B; margin: 32px 0 0 0;">If you didn't create this account, please ignore this email.</p>
            </div>
            <p style="font-size: 12px; color: #94A3B8; text-align: center; margin: 24px 0 0 0;">© 2025 Dog Trainers Directory. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to Dog Trainers Directory!

Hi ${data.userName || 'there'},

Thank you for registering with Dog Trainers Directory. Your account has been successfully created.

Get started: ${process.env.APP_URL || 'https://dogtrainersdirectory.com.au'}

If you didn't create this account, please ignore this email.

© 2025 Dog Trainers Directory. All rights reserved.`,
  }),

  [EmailTemplate.PASSWORD_RESET]: (data) => ({
    subject: 'Reset Your Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0A0A0A; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="background: #FFFFFF; border-radius: 12px; padding: 32px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
              <h1 style="color: #2563EB; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">Reset Your Password</h1>
              <p style="font-size: 16px; margin: 0 0 16px 0;">Hi ${data.userName || 'there'},</p>
              <p style="font-size: 16px; margin: 0 0 16px 0;">We received a request to reset your password. Click the button below to create a new password:</p>
              <div style="margin: 32px 0;">
                <a href="${data.resetLink}" style="display: inline-block; background: #2563EB; color: #FFFFFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 16px;">Reset Password</a>
              </div>
              <p style="font-size: 14px; color: #64748B; margin: 32px 0 0 0;">This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
            </div>
            <p style="font-size: 12px; color: #94A3B8; text-align: center; margin: 24px 0 0 0;">© 2025 Dog Trainers Directory. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `Reset Your Password

Hi ${data.userName || 'there'},

We received a request to reset your password. Click the link below to create a new password:

${data.resetLink}

This link will expire in 1 hour. If you didn't request this, please ignore this email.

© 2025 Dog Trainers Directory. All rights reserved.`,
  }),

  [EmailTemplate.BOOKING_CONFIRMATION]: (data) => ({
    subject: 'Booking Confirmation',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Confirmation</title>
        </head>
        <body style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0A0A0A; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="background: #FFFFFF; border-radius: 12px; padding: 32px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
              <h1 style="color: #2563EB; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">Booking Confirmed!</h1>
              <p style="font-size: 16px; margin: 0 0 16px 0;">Hi ${data.userName || 'there'},</p>
              <p style="font-size: 16px; margin: 0 0 16px 0;">Your booking with <strong>${data.trainerName || 'your trainer'}</strong> has been confirmed.</p>
              <div style="background: #F1F5F9; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${data.bookingDate || 'TBD'}</p>
                <p style="margin: 0 0 8px 0;"><strong>Time:</strong> ${data.bookingTime || 'TBD'}</p>
                <p style="margin: 0 0 8px 0;"><strong>Booking ID:</strong> ${data.bookingId || 'N/A'}</p>
              </div>
              <p style="font-size: 14px; color: #64748B; margin: 32px 0 0 0;">Please arrive 10 minutes early. If you need to reschedule, contact your trainer directly.</p>
            </div>
            <p style="font-size: 12px; color: #94A3B8; text-align: center; margin: 24px 0 0 0;">© 2025 Dog Trainers Directory. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `Booking Confirmed!

Hi ${data.userName || 'there'},

Your booking with ${data.trainerName || 'your trainer'} has been confirmed.

Date: ${data.bookingDate || 'TBD'}
Time: ${data.bookingTime || 'TBD'}
Booking ID: ${data.bookingId || 'N/A'}

Please arrive 10 minutes early. If you need to reschedule, contact your trainer directly.

© 2025 Dog Trainers Directory. All rights reserved.`,
  }),

  [EmailTemplate.BOOKING_REMINDER]: (data) => ({
    subject: 'Booking Reminder',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Reminder</title>
        </head>
        <body style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0A0A0A; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="background: #FFFFFF; border-radius: 12px; padding: 32px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
              <h1 style="color: #F59E0B; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">Booking Reminder</h1>
              <p style="font-size: 16px; margin: 0 0 16px 0;">Hi ${data.userName || 'there'},</p>
              <p style="font-size: 16px; margin: 0 0 16px 0;">This is a reminder that you have an upcoming booking with <strong>${data.trainerName || 'your trainer'}</strong>.</p>
              <div style="background: #FEF3C7; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${data.bookingDate || 'TBD'}</p>
                <p style="margin: 0 0 8px 0;"><strong>Time:</strong> ${data.bookingTime || 'TBD'}</p>
                <p style="margin: 0 0 8px 0;"><strong>Booking ID:</strong> ${data.bookingId || 'N/A'}</p>
              </div>
              <p style="font-size: 14px; color: #64748B; margin: 32px 0 0 0;">Please arrive 10 minutes early. If you need to reschedule, contact your trainer directly.</p>
            </div>
            <p style="font-size: 12px; color: #94A3B8; text-align: center; margin: 24px 0 0 0;">© 2025 Dog Trainers Directory. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `Booking Reminder

Hi ${data.userName || 'there'},

This is a reminder that you have an upcoming booking with ${data.trainerName || 'your trainer'}.

Date: ${data.bookingDate || 'TBD'}
Time: ${data.bookingTime || 'TBD'}
Booking ID: ${data.bookingId || 'N/A'}

Please arrive 10 minutes early. If you need to reschedule, contact your trainer directly.

© 2025 Dog Trainers Directory. All rights reserved.`,
  }),

  [EmailTemplate.FEATURED_PURCHASE]: (data) => ({
    subject: 'Featured Placement Purchase Confirmation',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Featured Placement Purchase Confirmation</title>
        </head>
        <body style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0A0A0A; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="background: #FFFFFF; border-radius: 12px; padding: 32px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
              <h1 style="color: #10B981; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">Featured Placement Purchased!</h1>
              <p style="font-size: 16px; margin: 0 0 16px 0;">Hi ${data.userName || 'there'},</p>
              <p style="font-size: 16px; margin: 0 0 16px 0;">Your featured placement has been successfully purchased.</p>
              <div style="background: #D1FAE5; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0 0 8px 0;"><strong>Duration:</strong> ${data.featuredDuration || 0} days</p>
                <p style="margin: 0 0 8px 0;"><strong>Council:</strong> ${data.featuredCouncil || 'N/A'}</p>
              </div>
              <p style="font-size: 14px; color: #64748B; margin: 32px 0 0 0;">Your featured placement will be activated within 24 hours. You'll receive another email when it goes live.</p>
            </div>
            <p style="font-size: 12px; color: #94A3B8; text-align: center; margin: 24px 0 0 0;">© 2025 Dog Trainers Directory. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `Featured Placement Purchased!

Hi ${data.userName || 'there'},

Your featured placement has been successfully purchased.

Duration: ${data.featuredDuration || 0} days
Council: ${data.featuredCouncil || 'N/A'}

Your featured placement will be activated within 24 hours. You'll receive another email when it goes live.

© 2025 Dog Trainers Directory. All rights reserved.`,
  }),

  [EmailTemplate.FEATURED_APPROVED]: (data) => ({
    subject: 'Featured Placement Approved',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Featured Placement Approved</title>
        </head>
        <body style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0A0A0A; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="background: #FFFFFF; border-radius: 12px; padding: 32px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
              <h1 style="color: #10B981; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">Featured Placement Approved!</h1>
              <p style="font-size: 16px; margin: 0 0 16px 0;">Hi ${data.userName || 'there'},</p>
              <p style="font-size: 16px; margin: 0 0 16px 0;">Your featured placement has been approved and is now live!</p>
              <p style="font-size: 14px; color: #64748B; margin: 32px 0 0 0;">Your profile will be featured for the duration you purchased. Thank you for choosing Dog Trainers Directory!</p>
            </div>
            <p style="font-size: 12px; color: #94A3B8; text-align: center; margin: 24px 0 0 0;">© 2025 Dog Trainers Directory. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `Featured Placement Approved!

Hi ${data.userName || 'there'},

Your featured placement has been approved and is now live!

Your profile will be featured for the duration you purchased. Thank you for choosing Dog Trainers Directory!

© 2025 Dog Trainers Directory. All rights reserved.`,
  }),

  [EmailTemplate.REVIEW_APPROVED]: (data) => ({
    subject: 'Review Approved',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Review Approved</title>
        </head>
        <body style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0A0A0A; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="background: #FFFFFF; border-radius: 12px; padding: 32px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
              <h1 style="color: #10B981; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">Review Approved!</h1>
              <p style="font-size: 16px; margin: 0 0 16px 0;">Hi ${data.userName || 'there'},</p>
              <p style="font-size: 16px; margin: 0 0 16px 0;">Your review has been approved and is now visible on the trainer's profile.</p>
              <p style="font-size: 14px; color: #64748B; margin: 32px 0 0 0;">Thank you for taking the time to share your experience!</p>
            </div>
            <p style="font-size: 12px; color: #94A3B8; text-align: center; margin: 24px 0 0 0;">© 2025 Dog Trainers Directory. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `Review Approved!

Hi ${data.userName || 'there'},

Your review has been approved and is now visible on the trainer's profile.

Thank you for taking the time to share your experience!

© 2025 Dog Trainers Directory. All rights reserved.`,
  }),

  [EmailTemplate.REVIEW_REJECTED]: (data) => ({
    subject: 'Review Rejected',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Review Rejected</title>
        </head>
        <body style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0A0A0A; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="background: #FFFFFF; border-radius: 12px; padding: 32px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
              <h1 style="color: #EF4444; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">Review Rejected</h1>
              <p style="font-size: 16px; margin: 0 0 16px 0;">Hi ${data.userName || 'there'},</p>
              <p style="font-size: 16px; margin: 0 0 16px 0;">Your review could not be approved at this time.</p>
              ${data.rejectionReason ? `<div style="background: #FEE2E2; border-radius: 8px; padding: 16px; margin: 24px 0;"><p style="margin: 0;"><strong>Reason:</strong> ${data.rejectionReason}</p></div>` : ''}
              <p style="font-size: 14px; color: #64748B; margin: 32px 0 0 0;">You can submit a new review at any time. If you have questions, please contact our support team.</p>
            </div>
            <p style="font-size: 12px; color: #94A3B8; text-align: center; margin: 24px 0 0 0;">© 2025 Dog Trainers Directory. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `Review Rejected

Hi ${data.userName || 'there'},

Your review could not be approved at this time.

${data.rejectionReason ? `Reason: ${data.rejectionReason}` : ''}

You can submit a new review at any time. If you have questions, please contact our support team.

© 2025 Dog Trainers Directory. All rights reserved.`,
  }),

  [EmailTemplate.WELCOME]: (data) => ({
    subject: 'Welcome to Dog Trainers Directory',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Dog Trainers Directory</title>
        </head>
        <body style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0A0A0A; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="background: #FFFFFF; border-radius: 12px; padding: 32px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
              <h1 style="color: #2563EB; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">Welcome to Dog Trainers Directory!</h1>
              <p style="font-size: 16px; margin: 0 0 16px 0;">Hi ${data.userName || 'there'},</p>
              <p style="font-size: 16px; margin: 0 0 16px 0;">We're excited to have you on board! Dog Trainers Directory is your go-to platform for finding the best dog trainers in Melbourne.</p>
              <div style="margin: 32px 0;">
                <a href="${process.env.APP_URL || 'https://dogtrainersdirectory.com.au'}" style="display: inline-block; background: #2563EB; color: #FFFFFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 16px;">Explore Trainers</a>
              </div>
              <p style="font-size: 14px; color: #64748B; margin: 32px 0 0 0;">If you have any questions, don't hesitate to reach out to our support team.</p>
            </div>
            <p style="font-size: 12px; color: #94A3B8; text-align: center; margin: 24px 0 0 0;">© 2025 Dog Trainers Directory. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to Dog Trainers Directory!

Hi ${data.userName || 'there'},

We're excited to have you on board! Dog Trainers Directory is your go-to platform for finding the best dog trainers in Melbourne.

Explore Trainers: ${process.env.APP_URL || 'https://dogtrainersdirectory.com.au'}

If you have any questions, don't hesitate to reach out to our support team.

© 2025 Dog Trainers Directory. All rights reserved.`,
  }),
};

// ============================================================================
// SMS TEMPLATES
// ============================================================================

/**
 * SMS templates
 * Text templates for different SMS types
 */
const smsTemplates: Record<SmsTemplate, (data: SmsTemplateData) => string> = {
  [SmsTemplate.BOOKING_REMINDER]: (data) => 
    `Reminder: You have a booking with ${data.trainerName || 'your trainer'} on ${data.bookingDate || 'TBD'} at ${data.bookingTime || 'TBD'}. Booking ID: ${data.bookingId || 'N/A'}. Arrive 10 mins early.`,

  [SmsTemplate.BOOKING_CANCELLED]: (data) =>
    `Your booking with ${data.trainerName || 'your trainer'} on ${data.bookingDate || 'TBD'} has been cancelled. Booking ID: ${data.bookingId || 'N/A'}. Contact support if needed.`,

  [SmsTemplate.URGENT_NOTIFICATION]: (data) =>
    `URGENT: ${data.urgentMessage || 'Please check your account for important updates.'}`,

  [SmsTemplate.VERIFICATION_CODE]: (data) =>
    `Your verification code is: ${data.verificationCode || '000000'}. Valid for 10 minutes. Don't share this code with anyone.`,
};

// ============================================================================
// EMAIL PROVIDER INTEGRATIONS
// ============================================================================

/**
 * SendGrid email provider
 */
class SendGridProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(to: string, subject: string, html: string, text: string): Promise<SendResult> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: to }],
            subject,
            content: [{
              type: 'text/html',
              value: html,
            }, {
              type: 'text/plain',
              value: text,
            }],
          }],
          from: {
            email: process.env.EMAIL_FROM || 'noreply@dogtrainersdirectory.com.au',
            name: 'Dog Trainers Directory',
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `SendGrid error: ${error}`,
          provider: EmailProvider.SENDGRID,
        };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.headers?.['X-Message-Id'],
        provider: EmailProvider.SENDGRID,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        provider: EmailProvider.SENDGRID,
      };
    }
  }
}

/**
 * AWS SES email provider
 */
class AwsSesProvider {
  private accessKeyId: string;
  private secretAccessKey: string;
  private region: string;

  constructor(accessKeyId: string, secretAccessKey: string, region: string = 'ap-southeast-2') {
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.region = region;
  }

  async send(to: string, subject: string, html: string, text: string): Promise<SendResult> {
    try {
      // Note: This is a simplified implementation
      // In production, use AWS SDK for proper SES integration
      const response = await fetch(`https://email.${this.region}.amazonaws.com`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          Action: 'SendEmail',
          Source: process.env.EMAIL_FROM || 'noreply@dogtrainersdirectory.com.au',
          Destination: {
            ToAddresses: to,
          },
          Message: {
            Subject: {
              Data: subject,
            },
            Body: {
              Html: {
                Data: html,
              },
              Text: {
                Data: text,
              },
            },
          },
        }).toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `AWS SES error: ${error}`,
          provider: EmailProvider.AWS_SES,
        };
      }

      const data = await response.text();
      const messageIdMatch = data.match(/<MessageId>([^<]+)<\/MessageId>/);
      
      return {
        success: true,
        messageId: messageIdMatch?.[1],
        provider: EmailProvider.AWS_SES,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        provider: EmailProvider.AWS_SES,
      };
    }
  }
}

// ============================================================================
// SMS PROVIDER INTEGRATIONS
// ============================================================================

/**
 * Twilio SMS provider
 */
class TwilioProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = fromNumber;
  }

  async send(to: string, message: string): Promise<SendResult> {
    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
          },
          body: new URLSearchParams({
            From: this.fromNumber,
            To: to,
            Body: message,
          }).toString(),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `Twilio error: ${error}`,
          provider: SmsProvider.TWILIO,
        };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.sid,
        provider: SmsProvider.TWILIO,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        provider: SmsProvider.TWILIO,
      };
    }
  }
}

// ============================================================================
// QUEUE SYSTEM
// ============================================================================

/**
 * Communication queue for async sending
 */
class CommunicationQueue {
  private pool: Pool;
  private processing: boolean = false;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Initialize queue table
   */
  async initialize(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS communication_queue (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type VARCHAR(10) NOT NULL CHECK (type IN ('email', 'sms')),
          message JSONB NOT NULL,
          attempts INTEGER DEFAULT 0,
          max_attempts INTEGER DEFAULT 3,
          next_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
          error TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          sent_at TIMESTAMP WITH TIME ZONE
        );
      `);
      
      // Create indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_queue_status ON communication_queue(status);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_queue_next_attempt ON communication_queue(next_attempt_at);');
    } finally {
      client.release();
    }
  }

  /**
   * Add item to queue
   */
  async enqueue(item: QueueItem): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO communication_queue (id, type, message, max_attempts, next_attempt_at, status, created_at)
         VALUES ($1, $2, $3, $4, NOW(), 'pending', NOW())`,
        [
          item.id,
          item.type,
          JSON.stringify(item.message),
          item.maxAttempts,
        ]
      );
    } finally {
      client.release();
    }
  }

  /**
   * Process pending queue items
   */
  async process(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      const client = await this.pool.connect();
      try {
        // Get pending items ready for processing
        const result = await client.query(`
          UPDATE communication_queue
          SET status = 'processing', attempts = attempts + 1
          WHERE id = (
            SELECT id FROM communication_queue
            WHERE status = 'pending' AND next_attempt_at <= NOW()
            ORDER BY next_attempt_at ASC
            LIMIT 10
            FOR UPDATE SKIP LOCKED
          )
          RETURNING *;
        `);

        const items = result.rows.map(row => ({
          id: row.id,
          type: row.type,
          message: JSON.parse(row.message),
          attempts: row.attempts,
          maxAttempts: row.max_attempts,
        }));

        // Process each item
        for (const item of items) {
          const result = await this.sendItem(item);
          
          if (result.success) {
            await client.query(
              `UPDATE communication_queue SET status = 'sent', sent_at = NOW() WHERE id = $1`,
              [item.id]
            );
          } else {
            // Calculate next attempt time (exponential backoff)
            const backoffMinutes = Math.pow(2, item.attempts) * 5;
            const nextAttemptAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
            
            if (item.attempts >= item.maxAttempts) {
              await client.query(
                `UPDATE communication_queue SET status = 'failed', error = $1 WHERE id = $2`,
                [result.error, item.id]
              );
            } else {
              await client.query(
                `UPDATE communication_queue SET next_attempt_at = $1, error = $2 WHERE id = $3`,
                [nextAttemptAt, result.error, item.id]
              );
            }
          }
        }
      } finally {
        client.release();
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Send a single queue item
   */
  private async sendItem(item: QueueItem): Promise<SendResult> {
    if (item.type === 'email') {
      const emailItem = item.message as EmailMessage;
      const template = emailTemplates[emailItem.template];
      const content = template(emailItem.data || {});
      
      const provider = this.getEmailProvider();
      return await provider.send(emailItem.to, content.subject, content.html, content.text);
    } else {
      const smsItem = item.message as SmsMessage;
      const template = smsTemplates[smsItem.template];
      const message = template(smsItem.data || {});
      
      const provider = this.getSmsProvider();
      return await provider.send(smsItem.to, message);
    }
  }

  /**
   * Get email provider instance
   */
  private getEmailProvider(): SendGridProvider | AwsSesProvider {
    const provider = process.env.EMAIL_PROVIDER || EmailProvider.SENDGRID;
    
    if (provider === EmailProvider.AWS_SES) {
      return new AwsSesProvider(
        process.env.AWS_ACCESS_KEY_ID || '',
        process.env.AWS_SECRET_ACCESS_KEY || '',
        process.env.AWS_REGION || 'ap-southeast-2'
      );
    }
    
    return new SendGridProvider(process.env.SENDGRID_API_KEY || '');
  }

  /**
   * Get SMS provider instance
   */
  private getSmsProvider(): TwilioProvider {
    return new TwilioProvider(
      process.env.TWILIO_ACCOUNT_SID || '',
      process.env.TWILIO_AUTH_TOKEN || '',
      process.env.TWILIO_FROM_NUMBER || ''
    );
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    pending: number;
    processing: number;
    sent: number;
    failed: number;
  }> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM communication_queue
        GROUP BY status;
      `);
      
      const stats = {
        pending: 0,
        processing: 0,
        sent: 0,
        failed: 0,
      };
      
      for (const row of result.rows) {
        stats[row.status as keyof typeof stats] = parseInt(row.count);
      }
      
      return stats;
    } finally {
      client.release();
    }
  }
}

// ============================================================================
// MAIN SERVICE
// ============================================================================

/**
 * Communication service
 * Main interface for sending emails and SMS
 */
export class CommunicationService {
  private queue: CommunicationQueue;

  constructor(pool: Pool) {
    this.queue = new CommunicationQueue(pool);
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    await this.queue.initialize();
  }

  /**
   * Send an email
   */
  async sendEmail(message: EmailMessage): Promise<SendResult> {
    const template = emailTemplates[message.template];
    const content = template(message.data || {});
    
    const provider = this.queue['getEmailProvider']();
    return await provider.send(message.to, content.subject, content.html, content.text);
  }

  /**
   * Send an SMS
   */
  async sendSms(message: SmsMessage): Promise<SendResult> {
    const template = smsTemplates[message.template];
    const text = template(message.data || {});
    
    const provider = this.queue['getSmsProvider']();
    return await provider.send(message.to, text);
  }

  /**
   * Queue an email for async sending
   */
  async queueEmail(message: EmailMessage): Promise<string> {
    const id = crypto.randomUUID();
    const queueItem: QueueItem = {
      id,
      type: 'email',
      message,
      attempts: 0,
      maxAttempts: 3,
      nextAttemptAt: new Date(),
      status: 'pending',
      createdAt: new Date(),
    };
    
    await this.queue.enqueue(queueItem);
    return id;
  }

  /**
   * Queue an SMS for async sending
   */
  async queueSms(message: SmsMessage): Promise<string> {
    const id = crypto.randomUUID();
    const queueItem: QueueItem = {
      id,
      type: 'sms',
      message,
      attempts: 0,
      maxAttempts: 3,
      nextAttemptAt: new Date(),
      status: 'pending',
      createdAt: new Date(),
    };
    
    await this.queue.enqueue(queueItem);
    return id;
  }

  /**
   * Process the queue
   */
  async processQueue(): Promise<void> {
    await this.queue.process();
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    sent: number;
    failed: number;
  }> {
    return await this.queue.getStats();
  }

  /**
   * Get email template
   */
  getEmailTemplate(template: EmailTemplate): (data: EmailTemplateData) => { subject: string; html: string; text: string } {
    return emailTemplates[template];
  }

  /**
   * Get SMS template
   */
  getSmsTemplate(template: SmsTemplate): (data: SmsTemplateData) => string {
    return smsTemplates[template];
  }
}

/**
 * Create communication service instance
 */
export function createCommunicationService(pool: Pool): CommunicationService {
  return new CommunicationService(pool);
}
