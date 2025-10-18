import ReCAPTCHA from "react-google-recaptcha";
import { useRef, forwardRef, useImperativeHandle } from "react";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";

export interface ReCaptchaRef {
  executeAsync: () => Promise<string | null>;
  reset: () => void;
}

interface ReCaptchaProps {
  onChange?: (token: string | null) => void;
  size?: "normal" | "compact" | "invisible";
}

export const ReCaptcha = forwardRef<ReCaptchaRef, ReCaptchaProps>(
  ({ onChange, size = "normal" }, ref) => {
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    useImperativeHandle(ref, () => ({
      executeAsync: async () => {
        if (!recaptchaRef.current) {
          return null;
        }
        return await recaptchaRef.current.executeAsync();
      },
      reset: () => {
        if (recaptchaRef.current) {
          recaptchaRef.current.reset();
        }
      },
    }));

    if (!RECAPTCHA_SITE_KEY) {
      console.warn("ReCAPTCHA site key is not configured");
      return null;
    }

    return (
      <div className="flex justify-center">
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={RECAPTCHA_SITE_KEY}
          onChange={onChange}
          size={size}
        />
      </div>
    );
  }
);

ReCaptcha.displayName = "ReCaptcha";
