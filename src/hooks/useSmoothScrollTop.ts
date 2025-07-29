import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useSmoothScrollTop = () => {
  const location = useLocation();

  useEffect(() => {
    // Scroll suave para o topo quando a rota muda
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [location.pathname]);

  return {
    scrollToTop: () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }
  };
};