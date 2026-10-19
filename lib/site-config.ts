/**
 * Centralised site configuration.
 *
 * Anything here that is `null` / empty is intentionally UNCONFIGURED —
 * the UI degrades gracefully instead of inventing a value.
 */

/**
 * "Book a Call" destination.
 *
 * ⚠️ UNCONFIGURED. No booking service (Calendly / Cal.com / Google
 * Appointment Schedule / SavvyCal …) exists anywhere in this repository —
 * verified by a full-repo search. No URL is invented here.
 *
 * To enable: paste your scheduling link, e.g.
 *   export const BOOKING_URL = 'https://calendly.com/ahmed-gwely/30min'
 *
 * While this is null, the "Book a Call" button falls back to email
 * (see CONTACT_EMAIL) so the action is never a dead end.
 */
export const BOOKING_URL: string | null = null

/** Public contact address, already used by the Contact section. */
export const CONTACT_EMAIL = 'ahmedgwbs@gmail.com'

/**
 * Existing Formspree endpoint — the ONLY submission backend in the project.
 * Already used by components/Contact.tsx. Reused rather than adding a service.
 */
export const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xnjoeqyd'

/** Business WhatsApp number (digits only, for wa.me links). */
export const BUSINESS_WHATSAPP = '201508942322'

/** Business WhatsApp number (human-readable display). */
export const WHATSAPP_DISPLAY = '+20 15 08942322'

/** Name used in WhatsApp pre-filled messages. */
export const BOOKER_NAME = 'Eng Ahmed Fathy Gwely'
