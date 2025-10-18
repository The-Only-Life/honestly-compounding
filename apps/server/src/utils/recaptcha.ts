import axios from 'axios';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const RECAPTCHA_SCORE_THRESHOLD = 0.5; // v3 score threshold (0.0-1.0, higher = more likely human)

export interface RecaptchaV3VerificationResponse {
  success: boolean;
  score: number; // 0.0 to 1.0 (1.0 is very likely a good interaction, 0.0 is very likely a bot)
  action: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

/**
 * Verify a reCAPTCHA v3 token with Google's API
 * v3 returns a score (0.0-1.0) instead of a checkbox
 * @param token The reCAPTCHA token from the client
 * @param remoteip Optional remote IP address of the user
 * @param minScore Minimum score to accept (default 0.5). Higher = more strict
 * @returns Promise<boolean> indicating if verification was successful and score is above threshold
 */
export async function verifyRecaptcha(
  token: string,
  remoteip?: string,
  minScore: number = RECAPTCHA_SCORE_THRESHOLD
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

    const response = await axios.post<RecaptchaV3VerificationResponse>(
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

    // For v3, check the score
    const { score, action } = response.data;
    console.log(`reCAPTCHA v3 verification - Action: ${action}, Score: ${score}`);

    if (score < minScore) {
      console.warn(`reCAPTCHA score ${score} is below threshold ${minScore}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return false;
  }
}
