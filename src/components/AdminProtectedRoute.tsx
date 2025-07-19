import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = sessionStorage.getItem("admin_authenticated");
      const loginTime = sessionStorage.getItem("admin_login_time");
      
      if (!authStatus || !loginTime) {
        setIsAuthenticated(false);
        return;
      }

      // Verificar se a sessão expirou (24 horas)
      const now = Date.now();
      const loginTimestamp = parseInt(loginTime);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (now - loginTimestamp > twentyFourHours) {
        // Sessão expirada
        sessionStorage.removeItem("admin_authenticated");
        sessionStorage.removeItem("admin_login_time");
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);
    };

    checkAuth();
  }, []);

  // Enquanto verifica a autenticação
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Se não autenticado, redireciona para login admin
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Se autenticado, renderiza os children
  return <>{children}</>;
}