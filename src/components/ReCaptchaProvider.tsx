import { ReactNode, createContext, useContext } from "react";

interface ReCaptchaContextProps {
  siteKey: string;
}

const ReCaptchaContext = createContext<ReCaptchaContextProps | null>(null);

interface ReCaptchaProviderProps {
  children: ReactNode;
}

export default function ReCaptchaProvider({ children }: ReCaptchaProviderProps) {
  // Using your reCAPTCHA v2 site key from the image
  const siteKey = "6Lc_M1rqAAAAOQ9Z17CLgvjz_s_5nihlcuvSIx0";
  
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