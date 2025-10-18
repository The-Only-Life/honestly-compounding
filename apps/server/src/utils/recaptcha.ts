import axios from 'axios';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

export interface RecaptchaVerificationResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

/**
 * Verify a reCAPTCHA token with Google's API
 * @param token The reCAPTCHA token from the client
 * @param remoteip Optional remote IP address of the user
 * @returns Promise<boolean> indicating if verification was successful
 */
export async function verifyRecaptcha(
  token: string,
  remoteip?: string
): Promise<boolean> {
  if (!RECAPTCHA_SECRET_KEY) {
    console.warn('RECAPTCHA_SECRET_KEY is not configured. Skipping verification.');
    // In development, you might want to skip verification
    // In production, this should return false or throw an error
    return process.env.NODE_ENV === 'development';
  }

  try {
    const params = new URLSearchParams({
      secret: RECAPTCHA_SECRET_KEY,
      response: token,
    });

    if (remoteip) {
      params.append('remoteip', remoteip);
    }

    const response = await axios.post<RecaptchaVerificationResponse>(
      RECAPTCHA_VERIFY_URL,
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!response.data.success) {
      console.error('reCAPTCHA verification failed:', response.data['error-codes']);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return false;
  }
}
