import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const pageNames: Record<string, string> = {
  '/': 'Home',
  '/dashboard': 'Dashboard',
  '/chat': 'Chat',
  '/login': 'Login',
  '/cadastro': 'Cadastro',
  '/confirmar-email': 'Confirmar Email',
  '/comprar-creditos': 'Comprar Créditos',
  '/pagamento': 'Pagamento',
  '/minha-conta': 'Minha Conta',
  '/contato': 'Contato',
  '/termos': 'Termos de Uso',
  '/privacidade': 'Política de Privacidade',
  '/teste-webhook': 'Teste Webhook'
};

export const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const pageName = pageNames[location.pathname] || 'Página';
    document.title = `Oráculo Jurídico - ${pageName}`;
  }, [location.pathname]);
};