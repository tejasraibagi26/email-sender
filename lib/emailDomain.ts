// Split out from lib/mailer.ts so client components (e.g. SenderAddressForm)
// can read DOMAIN without pulling in server-only code (Resend, supabaseAdmin)
// into the browser bundle.
export const DOMAIN = 'mails.useuplift.live';
