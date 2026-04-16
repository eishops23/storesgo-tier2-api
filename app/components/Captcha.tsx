"use client";

import { useEffect, useRef, useCallback, useState } from "react";

// CAPTCHA provider types
type CaptchaProvider = "recaptcha" | "hcaptcha";

interface CaptchaProps {
  /** Callback when CAPTCHA is successfully completed */
  onVerify: (token: string) => void;
  /** Callback when CAPTCHA expires */
  onExpire?: () => void;
  /** Callback when CAPTCHA encounters an error */
  onError?: (error: string) => void;
  /** The CAPTCHA provider to use */
  provider?: CaptchaProvider;
  /** reCAPTCHA site key (required for reCAPTCHA) */
  recaptchaSiteKey?: string;
  /** hCaptcha site key (required for hCaptcha) */
  hcaptchaSiteKey?: string;
  /** Theme: light or dark */
  theme?: "light" | "dark";
  /** Size: normal or compact */
  size?: "normal" | "compact";
  /** Additional CSS class */
  className?: string;
}

// Declare global types for CAPTCHA libraries
declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: string;
          size?: string;
        }
      ) => number;
      reset: (widgetId?: number) => void;
      execute: (widgetId?: number) => void;
    };
    hcaptcha?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: string;
          size?: string;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      execute: (widgetId?: string) => void;
    };
    onRecaptchaLoad?: () => void;
    onHcaptchaLoad?: () => void;
  }
}

// Track script loading state
const scriptLoadState: Record<CaptchaProvider, "idle" | "loading" | "loaded" | "error"> = {
  recaptcha: "idle",
  hcaptcha: "idle",
};

// Queue callbacks for when script loads
const loadCallbacks: Record<CaptchaProvider, (() => void)[]> = {
  recaptcha: [],
  hcaptcha: [],
};

/**
 * Load CAPTCHA script dynamically
 */
function loadCaptchaScript(provider: CaptchaProvider): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (scriptLoadState[provider] === "loaded") {
      resolve();
      return;
    }

    // Add to callbacks queue
    loadCallbacks[provider].push(() => resolve());

    // Already loading, wait for callbacks
    if (scriptLoadState[provider] === "loading") {
      return;
    }

    // Start loading
    scriptLoadState[provider] = "loading";

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;

    if (provider === "recaptcha") {
      // Set global callback for reCAPTCHA
      window.onRecaptchaLoad = () => {
        scriptLoadState.recaptcha = "loaded";
        loadCallbacks.recaptcha.forEach((cb) => cb());
        loadCallbacks.recaptcha = [];
      };
      script.src = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";
    } else {
      // Set global callback for hCaptcha
      window.onHcaptchaLoad = () => {
        scriptLoadState.hcaptcha = "loaded";
        loadCallbacks.hcaptcha.forEach((cb) => cb());
        loadCallbacks.hcaptcha = [];
      };
      script.src = "https://js.hcaptcha.com/1/api.js?onload=onHcaptchaLoad&render=explicit";
    }

    script.onerror = () => {
      scriptLoadState[provider] = "error";
      loadCallbacks[provider].forEach(() => reject(new Error(`Failed to load ${provider} script`)));
      loadCallbacks[provider] = [];
    };

    document.head.appendChild(script);
  });
}

/**
 * CAPTCHA Component
 * Supports both Google reCAPTCHA v2 and hCaptcha
 */
export default function Captcha({
  onVerify,
  onExpire,
  onError,
  provider: providerProp,
  recaptchaSiteKey,
  hcaptchaSiteKey,
  theme = "light",
  size = "normal",
  className = "",
}: CaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine provider from props or environment
  const provider: CaptchaProvider = providerProp || 
    (process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER as CaptchaProvider) || 
    "recaptcha";

  // Get site key
  const siteKey = provider === "hcaptcha"
    ? hcaptchaSiteKey || process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY
    : recaptchaSiteKey || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  // Handle verification callback
  const handleVerify = useCallback(
    (token: string) => {
      onVerify(token);
    },
    [onVerify]
  );

  // Handle expiration callback
  const handleExpire = useCallback(() => {
    onExpire?.();
  }, [onExpire]);

  // Handle error callback
  const handleError = useCallback(() => {
    const errorMsg = `${provider} verification failed`;
    setError(errorMsg);
    onError?.(errorMsg);
  }, [provider, onError]);

  // Initialize CAPTCHA
  useEffect(() => {
    if (!siteKey) {
      const errorMsg = `${provider} site key not configured`;
      setError(errorMsg);
      setIsLoading(false);
      return;
    }

    let mounted = true;

    async function initCaptcha() {
      try {
        await loadCaptchaScript(provider);

        if (!mounted || !containerRef.current) return;

        // Clear any existing widget
        containerRef.current.innerHTML = "";

        if (provider === "recaptcha" && window.grecaptcha) {
          window.grecaptcha.ready(() => {
            if (!mounted || !containerRef.current) return;

            widgetIdRef.current = window.grecaptcha!.render(containerRef.current, {
              sitekey: siteKey,
              callback: handleVerify,
              "expired-callback": handleExpire,
              "error-callback": handleError,
              theme,
              size,
            });

            setIsLoading(false);
          });
        } else if (provider === "hcaptcha" && window.hcaptcha) {
          widgetIdRef.current = window.hcaptcha.render(containerRef.current, {
            sitekey: siteKey,
            callback: handleVerify,
            "expired-callback": handleExpire,
            "error-callback": handleError,
            theme,
            size,
          });

          setIsLoading(false);
        }
      } catch (err: any) {
        if (!mounted) return;
        const errorMsg = err.message || `Failed to load ${provider}`;
        setError(errorMsg);
        setIsLoading(false);
        onError?.(errorMsg);
      }
    }

    initCaptcha();

    return () => {
      mounted = false;
    };
  }, [provider, siteKey, theme, size, handleVerify, handleExpire, handleError, onError]);

  // Error state
  if (error) {
    return (
      <div className={`captcha-error text-red-500 text-sm p-2 border border-red-200 rounded ${className}`}>
        ⚠️ {error}
      </div>
    );
  }

  return (
    <div className={`captcha-container ${className}`}>
      {isLoading && (
        <div className="captcha-loading flex items-center justify-center p-4 border rounded bg-gray-50 min-h-[78px]">
          <div className="animate-pulse text-gray-500 text-sm">
            Loading CAPTCHA...
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className={isLoading ? "hidden" : ""}
        data-provider={provider}
      />
    </div>
  );
}

/**
 * Reset the CAPTCHA widget
 */
export function resetCaptcha(provider: CaptchaProvider = "recaptcha", widgetId?: number | string) {
  if (provider === "recaptcha" && window.grecaptcha) {
    window.grecaptcha.reset(widgetId as number);
  } else if (provider === "hcaptcha" && window.hcaptcha) {
    window.hcaptcha.reset(widgetId as string);
  }
}

