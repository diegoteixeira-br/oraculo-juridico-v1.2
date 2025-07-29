import { ReactNode, createContext, useContext } from "react";

interface ReCaptchaContextProps {
  siteKey: string;
}

const ReCaptchaContext = createContext<ReCaptchaContextProps | null>(null);

interface ReCaptchaProviderProps {
  children: ReactNode;
}

export default function ReCaptchaProvider({ children }: ReCaptchaProviderProps) {
  // reCAPTCHA v2 site key - é seguro estar aqui pois é uma chave pública
  const siteKey = "6Lc_MJIrAAAAAO9NzI7CLgvjz_s_5nihlcuvSIxO";
  
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