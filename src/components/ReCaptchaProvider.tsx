import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { ReactNode } from "react";

interface ReCaptchaProviderProps {
  children: ReactNode;
}

export default function ReCaptchaProvider({ children }: ReCaptchaProviderProps) {
  // In production, this will be replaced by the actual site key from Supabase secrets
  const reCaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";
  
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={reCaptchaKey}
      language="pt-BR"
    >
      {children}
    </GoogleReCaptchaProvider>
  );
}