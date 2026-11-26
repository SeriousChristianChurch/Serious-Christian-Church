// Supabase project settings (Supabase → Project Settings → API).
// The publishable key is safe to put here. Never put the secret key in this file.
export const SUPABASE_URL = 'https://kkiqakrxyfbmgmhvwrfp.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_FhHYd-QmlJSosB3AJWlZQg_eRlrUeju';

// Church defaults. The pastor can change the name, giving details and campaign inside the app (More → Church admin).
export const CHURCH = {
  name: 'Serious Christian Church',
  currency: 'R',
  countryCode: '27',        // used to turn 082… into +27 82… for WhatsApp links
  locale: 'en-ZA',
  emergencyNumber: '112'
};
