import { ReactNode, createContext, useContext } from "react";

interface ReCaptchaContextProps {
  siteKey: string;
}

const ReCaptchaContext = createContext<ReCaptchaContextProps | null>(null);

interface ReCaptchaProviderProps {
  children: ReactNode;
}

export default function ReCaptchaProvider({ children }: ReCaptchaProviderProps) {
  // In production, this will be replaced by the actual site key from Supabase secrets
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";
  
  return (
    <ReCaptchaContext.Provider value={{ siteKey }}>
      {children}
    </ReCaptchaContext.Provider>
  );
}

export const useReCaptcha = () => {
  const context = useContext(ReCaptchaContext);
  if (!context) {
    throw new Error('useReCaptcha must be used within a ReCaptchaProvider');
  }
  return context;
};