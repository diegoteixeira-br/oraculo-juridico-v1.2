import { useState, useEffect, useRef } from "react";
import { ArrowLeft, CreditCard, History, Plus, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [dailyCredits, setDailyCredits] = useState(0);
  const [totalCreditsPurchased, setTotalCreditsPurchased] = useState(0);

  const totalAvailableCredits = userCredits + dailyCredits;

  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, credits, daily_credits, total_credits_purchased')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          setAvatarUrl(profile.avatar_url);
          setUserCredits(profile.credits || 0);
          setDailyCredits(profile.daily_credits || 0);
          setTotalCreditsPurchased(profile.total_credits_purchased || 0);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    };

    loadUserData();
  }, [user?.id]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validação do arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro no upload",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload da imagem
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // Atualizar perfil no banco
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast({
        title: "Avatar atualizado!",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });

    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível fazer upload da imagem.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/chat")}
              className="text-primary hover:text-primary/80"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Chat
            </Button>
          </div>
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
          
          <h1 className="text-3xl font-bold text-primary mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Controle seus créditos e informações
          </p>
        </div>

        {/* Credit Overview Banner */}
        <div className="mt-4 p-6 bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-xl">
          <div className="flex items-center gap-3 justify-center">
            <CreditCard className="w-6 h-6 text-primary" />
            <span className="text-2xl font-bold text-primary">
              {totalAvailableCredits} créditos disponíveis
            </span>
          </div>
          <p className="text-center text-primary/80 mt-2">
            {dailyCredits > 0 && (
              <span>{dailyCredits} créditos diários + </span>
            )}
            {userCredits} créditos comprados
          </p>
        </div>

        {/* Credits Details Card */}
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
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-6 bg-primary/10 rounded-lg border border-primary/20">
                <div className="text-3xl font-bold text-primary">{totalAvailableCredits}</div>
                <div className="text-sm text-muted-foreground">Total Disponíveis</div>
              </div>
              <div className="text-center p-6 bg-green-600/10 rounded-lg border border-green-600/20">
                <div className="text-3xl font-bold text-green-400">{dailyCredits}</div>
                <div className="text-sm text-muted-foreground">Créditos Diários</div>
              </div>
              <div className="text-center p-6 bg-secondary/10 rounded-lg border border-secondary/20">
                <div className="text-3xl font-bold text-secondary-foreground">{userCredits}</div>
                <div className="text-sm text-muted-foreground">Créditos Comprados</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between py-4 border-t border-slate-600">
              <span className="font-medium">Custo por pesquisa:</span>
              <span className="text-primary font-bold">1 crédito</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => navigate("/comprar-creditos")}
                className="flex-1 bg-primary hover:bg-primary/90 py-3"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Comprar Mais Créditos
              </Button>
              <Button 
                onClick={() => navigate("/historico-transacoes")}
                variant="outline"
                className="flex-1 border-primary/20 hover:bg-primary/10 py-3"
                size="lg"
              >
                <History className="w-5 h-5 mr-2" />
                Ver Histórico
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-slate-800 border-slate-700 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate("/chat")}>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Iniciar Consulta</h3>
              <p className="text-muted-foreground text-sm">Faça uma nova pergunta jurídica</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate("/minha-conta")}>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Minha Conta</h3>
              <p className="text-muted-foreground text-sm">Gerencie suas configurações</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}