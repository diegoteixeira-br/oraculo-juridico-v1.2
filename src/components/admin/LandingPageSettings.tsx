import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Youtube, Megaphone } from "lucide-react";

interface LandingPageSettings {
  id: string;
  youtube_video_id: string | null;
  video_title: string;
  video_description: string;
  video_enabled: boolean;
  launch_offer_enabled: boolean;
  launch_offer_text: string;
  launch_offer_code: string;
  launch_offer_discount_percentage: number;
}

export default function LandingPageSettings() {
  const [settings, setSettings] = useState<LandingPageSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    youtube_video_id: "",
    video_title: "",
    video_description: "",
    video_enabled: true,
    launch_offer_enabled: false,
    launch_offer_text: "OFERTA DE LANÇAMENTO: Use o cupom ORACULO10 e ganhe 10% de desconto no seu primeiro mês. Válido por tempo limitado!",
    launch_offer_code: "ORACULO10",
    launch_offer_discount_percentage: 10
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("landing_page_settings")
        .select("*")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
        setFormData({
          youtube_video_id: data.youtube_video_id || "",
          video_title: data.video_title || "",
          video_description: data.video_description || "",
          video_enabled: data.video_enabled ?? true,
          launch_offer_enabled: data.launch_offer_enabled ?? false,
          launch_offer_text: data.launch_offer_text || "OFERTA DE LANÇAMENTO: Use o cupom ORACULO10 e ganhe 10% de desconto no seu primeiro mês. Válido por tempo limitado!",
          launch_offer_code: data.launch_offer_code || "ORACULO10",
          launch_offer_discount_percentage: data.launch_offer_discount_percentage ?? 10
        });
      }
    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações da página de venda",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settings) {
        // Atualizar configuração existente
        const { error } = await supabase
          .from("landing_page_settings")
          .update({
            youtube_video_id: formData.youtube_video_id || null,
            video_title: formData.video_title,
            video_description: formData.video_description,
            video_enabled: formData.video_enabled,
            launch_offer_enabled: formData.launch_offer_enabled,
            launch_offer_text: formData.launch_offer_text,
            launch_offer_code: formData.launch_offer_code,
            launch_offer_discount_percentage: formData.launch_offer_discount_percentage
          })
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        // Criar nova configuração
        const { error } = await supabase
          .from("landing_page_settings")
          .insert({
            youtube_video_id: formData.youtube_video_id || null,
            video_title: formData.video_title,
            video_description: formData.video_description,
            video_enabled: formData.video_enabled,
            launch_offer_enabled: formData.launch_offer_enabled,
            launch_offer_text: formData.launch_offer_text,
            launch_offer_code: formData.launch_offer_code,
            launch_offer_discount_percentage: formData.launch_offer_discount_percentage
          });

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Configurações da página de venda atualizadas com sucesso!"
      });

      fetchSettings(); // Recarregar dados
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const extractVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : url;
  };

  const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const videoId = extractVideoId(value);
    setFormData({ ...formData, youtube_video_id: videoId });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="h-5 w-5" />
          Configurações da Página de Venda
        </CardTitle>
        <CardDescription>
          Configure o vídeo explicativo exibido na página de venda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Switch para ativar/desativar vídeo */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">Exibir Vídeo na Página de Venda</Label>
            <p className="text-sm text-muted-foreground">
              Ative para mostrar o vídeo na página de venda, desative para ocultar
            </p>
          </div>
          <Switch
            checked={formData.video_enabled}
            onCheckedChange={(checked) => 
              setFormData(prev => ({ ...prev, video_enabled: checked }))
            }
          />
        </div>

        {/* Preview do vídeo atual */}
        {formData.youtube_video_id && formData.youtube_video_id !== 'VIDEO_ID' && formData.youtube_video_id.trim() !== '' && (
          <div className="space-y-2">
            <Label>Preview do Vídeo</Label>
            <div className="w-[45%] mx-auto">
              <div className="aspect-video bg-slate-800/50 rounded-lg border border-border overflow-hidden">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${formData.youtube_video_id}?rel=0&modestbranding=1&showinfo=0`}
                  title="Preview do vídeo"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
            <div className="text-center">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setFormData({ ...formData, youtube_video_id: '' })}
                className="text-destructive hover:text-destructive"
              >
                Remover Vídeo
              </Button>
            </div>
          </div>
        )}

        {/* Campo para URL/ID do vídeo */}
        <div className="space-y-2">
          <Label htmlFor="youtube_video_id">
            URL ou ID do Vídeo do YouTube
          </Label>
          <Input
            id="youtube_video_id"
            value={formData.youtube_video_id}
            onChange={handleVideoUrlChange}
            placeholder="Cole aqui a URL completa ou apenas o ID do vídeo"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Exemplo: https://youtube.com/watch?v=abc123 ou apenas abc123
          </p>
        </div>

        {/* Título do vídeo */}
        <div className="space-y-2">
          <Label htmlFor="video_title">Título da Seção</Label>
          <Input
            id="video_title"
            value={formData.video_title}
            onChange={(e) => setFormData({ ...formData, video_title: e.target.value })}
            placeholder="Veja Como Funciona na Prática"
          />
        </div>

        {/* Descrição do vídeo */}
        <div className="space-y-2">
          <Label htmlFor="video_description">Descrição</Label>
          <Textarea
            id="video_description"
            value={formData.video_description}
            onChange={(e) => setFormData({ ...formData, video_description: e.target.value })}
            placeholder="Assista ao vídeo demonstrativo e descubra como o Oráculo Jurídico pode revolucionar sua prática advocatícia"
            rows={3}
          />
        </div>

        {/* Separador */}
        <div className="border-t border-border my-6"></div>

        {/* Configurações da Oferta de Lançamento */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="h-5 w-5" />
            <h3 className="text-lg font-medium">Oferta de Lançamento</h3>
          </div>

          {/* Switch para ativar/desativar oferta */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Exibir Oferta de Lançamento</Label>
              <p className="text-sm text-muted-foreground">
                Ative para mostrar a oferta no topo da página de venda
              </p>
            </div>
            <Switch
              checked={formData.launch_offer_enabled}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, launch_offer_enabled: checked }))
              }
            />
          </div>

          {/* Texto da oferta */}
          <div className="space-y-2">
            <Label htmlFor="launch_offer_text">Texto da Oferta</Label>
            <Textarea
              id="launch_offer_text"
              value={formData.launch_offer_text}
              onChange={(e) => setFormData({ ...formData, launch_offer_text: e.target.value })}
              placeholder="OFERTA DE LANÇAMENTO: Use o cupom ORACULO10 e ganhe 10% de desconto..."
              rows={3}
            />
          </div>

          {/* Código do cupom */}
          <div className="space-y-2">
            <Label htmlFor="launch_offer_code">Código do Cupom</Label>
            <Input
              id="launch_offer_code"
              value={formData.launch_offer_code}
              onChange={(e) => setFormData({ ...formData, launch_offer_code: e.target.value })}
              placeholder="ORACULO10"
            />
          </div>

          {/* Percentual de desconto */}
          <div className="space-y-2">
            <Label htmlFor="launch_offer_discount">Percentual de Desconto (%)</Label>
            <Input
              id="launch_offer_discount"
              type="number"
              min="1"
              max="100"
              value={formData.launch_offer_discount_percentage}
              onChange={(e) => setFormData({ ...formData, launch_offer_discount_percentage: parseInt(e.target.value) || 0 })}
              placeholder="10"
            />
          </div>
        </div>

        {/* Botão salvar */}
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}