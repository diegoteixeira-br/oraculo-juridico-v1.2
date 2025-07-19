import { useState } from "react";
import { User, LogOut, Settings, MessageSquare, CreditCard } from "lucide-react";
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

interface UserMenuProps {
  hideOptions?: string[];
}

export default function UserMenu({ hideOptions = [] }: UserMenuProps) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const menuItems = [
    {
      key: "chat",
      label: "Iniciar Consulta",
      icon: MessageSquare,
      onClick: () => navigate("/chat"),
      show: !hideOptions.includes("chat")
    },
    {
      key: "dashboard", 
      label: "Dashboard",
      icon: CreditCard,
      onClick: () => navigate("/dashboard"),
      show: !hideOptions.includes("dashboard")
    },
    {
      key: "account",
      label: "Minha Conta", 
      icon: Settings,
      onClick: () => navigate("/minha-conta"),
      show: !hideOptions.includes("account")
    }
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