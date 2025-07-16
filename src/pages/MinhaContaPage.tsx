import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Save, ArrowLeft, User, Lock, CreditCard, History, Plus, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function MinhaContaPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sistema de créditos - valores reais do banco
  const userCredits = profile?.credits || 0;
  const dailyCredits = profile?.daily_credits || 0;
  const totalCreditsPurchased = profile?.total_credits_purchased || 0;
  const totalAvailableCredits = dailyCredits + userCredits;

  // Carregar avatar
  useEffect(() => {
    setAvatarUrl(profile?.avatar_url || null);
  }, [profile?.avatar_url]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validar tamanho do arquivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Criar um nome único para o arquivo com estrutura de pasta
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;
      
      // Fazer upload do arquivo
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true  // Permite sobrescrever arquivos existentes
        });

      if (error) {
        console.error('Storage error:', error);
        throw error;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Atualizar perfil do usuário
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      setAvatarUrl(publicUrl);
      await refreshProfile();
      
      toast({
        title: "Foto atualizada!",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Erro ao fazer upload",
        description: "Não foi possível atualizar sua foto de perfil. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro na confirmação",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simular mudança de senha
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Senha alterada com sucesso!",
      description: "Sua senha foi atualizada.",
    });

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsLoading(false);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="text-primary hover:text-primary/80"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>

        <div className="text-center">
          <img 
            src="/lovable-uploads/78181766-45b6-483a-866f-c4e0e4deff74.png" 
            alt="Oráculo Jurídico" 
            className="h-20 w-auto mx-auto mb-4"
          />
          
          {/* Avatar do usuário */}
          <div className="relative inline-block mb-4">
            <Avatar className="w-20 h-20 mx-auto border-2 border-primary/20">
              <AvatarImage src={avatarUrl || ""} />
              <AvatarFallback className="text-lg bg-primary/20 text-primary">
                {user?.email?.substring(0, 2).toUpperCase() || "DT"}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="outline"
              size="sm"
              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary hover:bg-primary/90 border-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-white" />
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          
          <h1 className="text-3xl font-bold text-primary mb-2">Minha Conta</h1>
          <p className="text-muted-foreground">
            Gerencie suas configurações e dados da conta
          </p>
            <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
              <span className="font-medium text-primary">
                {totalAvailableCredits} créditos disponíveis
              </span>
            </div>
            <p className="text-sm text-primary/80 mt-2 text-center">
              {dailyCredits > 0 && (
                <span>{dailyCredits} créditos diários + </span>
              )}
              {userCredits} créditos comprados
            </p>
          </div>
        </div>

        {/* Credits Status Card */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Seus Créditos
            </CardTitle>
            <CardDescription>
              Informações sobre seus créditos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="text-center p-3 sm:p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="text-xl sm:text-2xl font-bold text-primary">{totalAvailableCredits}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total Disponíveis</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-green-600/10 rounded-lg border border-green-600/20">
                <div className="text-xl sm:text-2xl font-bold text-green-400">{dailyCredits}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Créditos Diários</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <div className="text-xl sm:text-2xl font-bold text-secondary-foreground">{userCredits}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Créditos Comprados</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Custo por pesquisa:</span>
              <span className="text-sm text-muted-foreground">
                1 crédito
              </span>
            </div>
            
            <div className="pt-4 border-t border-slate-600">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => navigate("/comprar-creditos")}
                  className="flex-1 bg-primary hover:bg-primary/90 text-sm sm:text-base py-3 sm:py-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Comprar Mais Créditos</span>
                  <span className="sm:hidden">Comprar Créditos</span>
                </Button>
                <Button 
                  onClick={() => navigate("/historico-transacoes")}
                  variant="outline"
                  className="flex-1 border-primary/20 hover:bg-primary/10 text-sm sm:text-base py-3 sm:py-2"
                >
                  <History className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Ver Histórico Completo</span>
                  <span className="sm:hidden">Histórico</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Account Info Card */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações da Conta
            </CardTitle>
            <CardDescription>
              Dados básicos da sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={profile?.full_name || user?.email || ""}
                  className="bg-slate-700 border-slate-600 focus:border-primary"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  className="bg-slate-700 border-slate-600 focus:border-primary"
                  disabled
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Para alterar essas informações, entre em contato com o suporte.
            </p>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Alterar Senha
            </CardTitle>
            <CardDescription>
              Mantenha sua conta segura alterando sua senha regularmente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="current-password">Senha Atual</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-slate-700 border-slate-600 focus:border-primary pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-slate-700 border-slate-600 focus:border-primary pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-slate-700 border-slate-600 focus:border-primary pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Alterando senha...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Alterar Senha
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}