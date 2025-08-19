import { useEffect, useState } from "react";
import { User, LogOut, Settings, MessageSquare, CreditCard, Calculator, Heart, Shield, History, Calendar, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
interface UserMenuProps {
  hideOptions?: string[];
}

export default function UserMenu({ hideOptions = [] }: UserMenuProps) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user) {
      setIsAdmin(false);
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase.rpc('is_current_user_admin');
        if (!active) return;
        if (error) {
          console.error('Erro verificando admin:', error);
          setIsAdmin(false);
          return;
        }
        setIsAdmin(!!data);
      } catch {
        if (active) setIsAdmin(false);
      }
    })();
    return () => { active = false; };
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      // Usar navigate em vez de window.location.href
      navigate("/", { replace: true });
    } catch (error) {
      console.error('Erro no logout:', error);
      // Em caso de erro, força o redirect
      navigate("/", { replace: true });
    }
  };

  // Mapear rotas para keys do menu
  const routeToMenuKey: { [key: string]: string } = {
    '/': 'blog',
    '/blog': 'blog',
    '/dashboard': 'dashboard',
    '/chat': 'chat',
    '/agenda-juridica': 'agenda',
    '/calculo-contrato-bancario': 'calc-contrato',
    '/calculo-pensao-alimenticia': 'calc-pensao',
    '/historico-transacoes': 'historico',
    '/minha-conta': 'account',
    '/admin': 'admin'
  };

  const currentPageKey = routeToMenuKey[location.pathname];

  const menuItems = [
    {
      key: "blog", 
      label: "Blog Jurídico",
      icon: BookOpen,
      onClick: () => navigate("/blog"),
      show: !hideOptions.includes("blog") && currentPageKey !== "blog" && currentPageKey === "dashboard",
    },
    {
      key: "dashboard", 
      label: "Dashboard",
      icon: CreditCard,
      onClick: () => navigate("/dashboard"),
      show: !hideOptions.includes("dashboard") && currentPageKey !== "dashboard",
    },
    {
      key: "chat",
      label: "Iniciar Consulta",
      icon: MessageSquare,
      onClick: () => navigate("/chat?new=true"),
      show: !hideOptions.includes("chat") && currentPageKey !== "chat",
    },
    {
      key: "agenda",
      label: "Agenda Jurídica",
      icon: Calendar,
      onClick: () => navigate("/agenda-juridica"),
      show: !hideOptions.includes("agenda") && currentPageKey !== "agenda",
    },
    {
      key: "calc-contrato",
      label: "Calc. Contrato Bancário",
      icon: Calculator,
      onClick: () => navigate("/calculo-contrato-bancario"),
      show: !hideOptions.includes("calc-contrato") && currentPageKey !== "calc-contrato",
    },
    {
      key: "calc-pensao",
      label: "Calc. Pensão Alimentícia",
      icon: Heart,
      onClick: () => navigate("/calculo-pensao-alimenticia"),
      show: !hideOptions.includes("calc-pensao") && currentPageKey !== "calc-pensao",
    },
    {
      key: "historico",
      label: "Histórico",
      icon: History,
      onClick: () => navigate("/historico-transacoes"),
      show: !hideOptions.includes("historico") && currentPageKey !== "historico",
    },
    {
      key: "account",
      label: "Minha Conta", 
      icon: Settings,
      onClick: () => navigate("/minha-conta"),
      show: !hideOptions.includes("account") && currentPageKey !== "account",
    },
    {
      key: "admin",
      label: "Admin",
      icon: Shield,
      onClick: () => navigate("/admin"),
      show: isAdmin && !hideOptions.includes("admin") && currentPageKey !== "admin",
    },
  ].filter(item => item.show);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 px-3 py-2 h-auto"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="text-sm bg-primary/20 text-primary">
              {user?.email?.substring(0, 2).toUpperCase() || "DT"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-white hidden sm:inline">
            Olá, {profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Diego T."}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-slate-800 border-slate-600" align="end">
        {menuItems.map((item) => (
          <DropdownMenuItem 
            key={item.key}
            onClick={item.onClick}
            className="cursor-pointer hover:bg-slate-700 text-white"
          >
            <item.icon className="w-4 h-4 mr-2" />
            {item.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-slate-600" />
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="cursor-pointer hover:bg-slate-700 text-red-400"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}