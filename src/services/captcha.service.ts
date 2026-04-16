/**
 * CAPTCHA Verification Service
 * Supports Google reCAPTCHA v2, v3, and hCaptcha
 */

import axios from "axios";

// CAPTCHA provider types
export type CaptchaProvider = "recaptcha" | "recaptcha_v3" | "hcaptcha";

// Verification endpoints
const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const HCAPTCHA_VERIFY_URL = "https://api.hcaptcha.com/siteverify";

// Response interfaces
interface RecaptchaV2Response {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

interface RecaptchaV3Response {
  success: boolean;
  score?: number; // 0.0 - 1.0 (1.0 = very likely human)
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

interface HcaptchaResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  credit?: boolean;
  "error-codes"?: string[];
}

export interface CaptchaVerificationResult {
  success: boolean;
  provider: CaptchaProvider;
  timestamp?: string;
  hostname?: string;
  score?: number; // reCAPTCHA v3 score
  action?: string; // reCAPTCHA v3 action
  errorCodes?: string[];
  error?: string;
}

// Default score threshold for reCAPTCHA v3 (0.5 is Google's recommended threshold)
const DEFAULT_V3_SCORE_THRESHOLD = 0.5;

/**
 * Get the current CAPTCHA provider from environment
 */
export function getCaptchaProvider(): CaptchaProvider {
  const provider = process.env.CAPTCHA_PROVIDER?.toLowerCase();
  if (provider === "hcaptcha") return "hcaptcha";
  if (provider === "recaptcha_v3" || provider === "recaptcha-v3") return "recaptcha_v3";
  return "recaptcha"; // default to v2
}

/**
 * Check if CAPTCHA is enabled
 */
export function isCaptchaEnabled(): boolean {
  // Master switch
  if (process.env.CAPTCHA_ENABLED === "false") return false;
  if (process.env.FEATURE_CAPTCHA === "false") return false;
  
  // Development bypass
  if (
    process.env.NODE_ENV === "development" &&
    process.env.CAPTCHA_BYPASS_IN_DEV === "true"
  ) {
    return false;
  }
  
  return true;
}

/**
 * Get the secret key for the current provider
 */
function getSecretKey(provider: CaptchaProvider): string | undefined {
  if (provider === "hcaptcha") {
    return process.env.HCAPTCHA_SECRET_KEY;
  }
  // Both v2 and v3 use the same env var
  return process.env.RECAPTCHA_SECRET_KEY;
}

/**
 * Get the score threshold for reCAPTCHA v3
 */
function getScoreThreshold(): number {
  const threshold = parseFloat(process.env.RECAPTCHA_V3_SCORE_THRESHOLD || "");
  if (!isNaN(threshold) && threshold >= 0 && threshold <= 1) {
    return threshold;
  }
  return DEFAULT_V3_SCORE_THRESHOLD;
}

/**
 * Verify a CAPTCHA token with Google reCAPTCHA v2
 */
async function verifyRecaptchaV2(
  token: string,
  remoteIp?: string
): Promise<CaptchaVerificationResult> {
  const secret = getSecretKey("recaptcha");
  
  if (!secret) {
    return {
      success: false,
      provider: "recaptcha",
      error: "reCAPTCHA secret key not configured",
    };
  }

  try {
    const params = new URLSearchParams({
      secret,
      response: token,
      ...(remoteIp && { remoteip: remoteIp }),
    });

    const response = await axios.post<RecaptchaV2Response>(
      RECAPTCHA_VERIFY_URL,
      params.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000,
      }
    );

    const data = response.data;

    return {
      success: data.success,
      provider: "recaptcha",
      timestamp: data.challenge_ts,
      hostname: data.hostname,
      errorCodes: data["error-codes"],
    };
  } catch (err: any) {
    return {
      success: false,
      provider: "recaptcha",
      error: `reCAPTCHA verification failed: ${err.message}`,
    };
  }
}

/**
 * Verify a CAPTCHA token with Google reCAPTCHA v3
 */
async function verifyRecaptchaV3(
  token: string,
  remoteIp?: string,
  expectedAction?: string
): Promise<CaptchaVerificationResult> {
  const secret = getSecretKey("recaptcha_v3");
  
  if (!secret) {
    return {
      success: false,
      provider: "recaptcha_v3",
      error: "reCAPTCHA v3 secret key not configured",
    };
  }

  try {
    const params = new URLSearchParams({
      secret,
      response: token,
      ...(remoteIp && { remoteip: remoteIp }),
    });

    const response = await axios.post<RecaptchaV3Response>(
      RECAPTCHA_VERIFY_URL,
      params.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000,
      }
    );

    const data = response.data;
    const threshold = getScoreThreshold();

    // For v3, we need to check both success and score
    let isValid = data.success;
    
    if (isValid && data.score !== undefined) {
      isValid = data.score >= threshold;
    }

    // Optionally verify the action matches
    if (isValid && expectedAction && data.action) {
      isValid = data.action === expectedAction;
    }

    return {
      success: isValid,
      provider: "recaptcha_v3",
      timestamp: data.challenge_ts,
      hostname: data.hostname,
      score: data.score,
      action: data.action,
      errorCodes: data["error-codes"],
      ...(!isValid && data.score !== undefined && data.score < threshold && {
        error: `Score ${data.score.toFixed(2)} below threshold ${threshold}`,
      }),
    };
  } catch (err: any) {
    return {
      success: false,
      provider: "recaptcha_v3",
      error: `reCAPTCHA v3 verification failed: ${err.message}`,
    };
  }
}

/**
 * Verify a CAPTCHA token with hCaptcha
 */
async function verifyHcaptcha(
  token: string,
  remoteIp?: string
): Promise<CaptchaVerificationResult> {
  const secret = getSecretKey("hcaptcha");
  
  if (!secret) {
    return {
      success: false,
      provider: "hcaptcha",
      error: "hCaptcha secret key not configured",
    };
  }

  try {
    const params = new URLSearchParams({
      secret,
      response: token,
      ...(remoteIp && { remoteip: remoteIp }),
    });

    const response = await axios.post<HcaptchaResponse>(
      HCAPTCHA_VERIFY_URL,
      params.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000,
      }
    );

    const data = response.data;

    return {
      success: data.success,
      provider: "hcaptcha",
      timestamp: data.challenge_ts,
      hostname: data.hostname,
      errorCodes: data["error-codes"],
    };
  } catch (err: any) {
    return {
      success: false,
      provider: "hcaptcha",
      error: `hCaptcha verification failed: ${err.message}`,
    };
  }
}

/**
 * Verify a CAPTCHA token using the configured provider
 * @param token - The CAPTCHA response token from the frontend
 * @param remoteIp - Optional IP address of the user
 * @param expectedAction - Optional expected action for reCAPTCHA v3
 * @returns Verification result
 */
export async function verifyCaptcha(
  token: string,
  remoteIp?: string,
  expectedAction?: string
): Promise<CaptchaVerificationResult> {
  // If CAPTCHA is disabled, always return success
  if (!isCaptchaEnabled()) {
    return {
      success: true,
      provider: getCaptchaProvider(),
    };
  }

  // Validate token exists
  if (!token || typeof token !== "string" || token.trim() === "") {
    return {
      success: false,
      provider: getCaptchaProvider(),
      error: "CAPTCHA token is required",
    };
  }

  const provider = getCaptchaProvider();

  switch (provider) {
    case "hcaptcha":
      return verifyHcaptcha(token, remoteIp);
    case "recaptcha_v3":
      return verifyRecaptchaV3(token, remoteIp, expectedAction);
    default:
      return verifyRecaptchaV2(token, remoteIp);
  }
}

/**
 * Human-readable error messages for CAPTCHA error codes
 */
export function getCaptchaErrorMessage(result: CaptchaVerificationResult): string {
  if (result.error) {
    return result.error;
  }

  if (!result.errorCodes || result.errorCodes.length === 0) {
    return "CAPTCHA verification failed";
  }

  const errorCode = result.errorCodes[0];
  
  // Common error codes for all providers
  const errorMessages: Record<string, string> = {
    // reCAPTCHA error codes
    "missing-input-secret": "Server configuration error",
    "invalid-input-secret": "Server configuration error",
    "missing-input-response": "Please complete the CAPTCHA",
    "invalid-input-response": "Invalid CAPTCHA response, please try again",
    "bad-request": "Invalid request, please try again",
    "timeout-or-duplicate": "CAPTCHA expired, please try again",
    // hCaptcha error codes
    "invalid-or-already-seen-response": "CAPTCHA already used, please try again",
    "not-using-dummy-passcode": "Invalid test configuration",
    "sitekey-secret-mismatch": "Server configuration error",
  };

  return errorMessages[errorCode] || "CAPTCHA verification failed";
}

export default {
  verifyCaptcha,
  isCaptchaEnabled,
  getCaptchaProvider,
  getCaptchaErrorMessage,
};
