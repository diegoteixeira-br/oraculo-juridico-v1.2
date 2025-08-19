import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Settings, Code, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function BlogSettings() {
  const [settings, setSettings] = useState({
    googleAdsenseClientId: "",
    googleAdsenseEnabled: true,
    googleAnalyticsId: "",
    metaTitle: "Blog Jurídico - Oráculo Jurídico",
    metaDescription: "Artigos especializados em direito e jurisprudência",
    keywords: "direito, jurídico, advogados, legislação, jurisprudência",
    favicon: "",
    socialImage: "",
    canonicalUrl: "",
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_settings')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar configurações:', error);
        return;
      }
      
      if (data) {
        setSettings({
          googleAdsenseClientId: data.google_adsense_client_id || "",
          googleAdsenseEnabled: data.google_adsense_enabled || true,
          googleAnalyticsId: data.google_analytics_id || "",
          metaTitle: data.meta_title || "Blog Jurídico - Oráculo Jurídico",
          metaDescription: data.meta_description || "Artigos especializados em direito e jurisprudência",
          keywords: data.keywords || "direito, jurídico, advogados, legislação, jurisprudência",
          favicon: data.favicon || "",
          socialImage: data.social_image || "",
          canonicalUrl: data.canonical_url || "",
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setIsSaved(false);
    
    try {
      const { data: existingData } = await supabase
        .from('blog_settings')
        .select('id')
        .single();
      
      const settingsData = {
        google_adsense_client_id: settings.googleAdsenseClientId,
        google_adsense_enabled: settings.googleAdsenseEnabled,
        google_analytics_id: settings.googleAnalyticsId,
        meta_title: settings.metaTitle,
        meta_description: settings.metaDescription,
        keywords: settings.keywords,
        favicon: settings.favicon,
        social_image: settings.socialImage,
        canonical_url: settings.canonicalUrl,
      };
      
      let error;
      if (existingData) {
        // Atualizar registro existente
        const { error: updateError } = await supabase
          .from('blog_settings')
          .update(settingsData)
          .eq('id', existingData.id);
        error = updateError;
      } else {
        // Criar novo registro
        const { error: insertError } = await supabase
          .from('blog_settings')
          .insert(settingsData);
        error = insertError;
      }
      
      if (error) {
        throw error;
      }
      
      setIsSaved(true);
      toast({
        title: "Configurações salvas",
        description: "As configurações do blog foram atualizadas com sucesso.",
      });
      
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Monetização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Configurações de Monetização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Google AdSense</Label>
              <p className="text-sm text-muted-foreground">
                Ativar anúncios do Google AdSense no blog
              </p>
            </div>
            <Switch
              checked={settings.googleAdsenseEnabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, googleAdsenseEnabled: checked }))
              }
            />
          </div>
          
          {settings.googleAdsenseEnabled && (
            <div className="space-y-2">
              <Label htmlFor="adsense-client" className="flex items-center gap-2">
                ID do Cliente AdSense
                {settings.googleAdsenseClientId && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
              </Label>
              <div className="relative">
                <Input
                  id="adsense-client"
                  placeholder="ca-pub-xxxxxxxxxxxxxxxxx"
                  value={settings.googleAdsenseClientId}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, googleAdsenseClientId: e.target.value }))
                  }
                  className={settings.googleAdsenseClientId ? "pr-10" : ""}
                />
                {settings.googleAdsenseClientId && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {settings.googleAdsenseClientId 
                  ? "✓ ID do cliente configurado" 
                  : "Encontre seu ID do cliente na sua conta do Google AdSense"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de SEO
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meta-title">Título Meta Padrão</Label>
            <Input
              id="meta-title"
              value={settings.metaTitle}
              onChange={(e) => 
                setSettings(prev => ({ ...prev, metaTitle: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta-description">Descrição Meta Padrão</Label>
            <Textarea
              id="meta-description"
              rows={3}
              value={settings.metaDescription}
              onChange={(e) => 
                setSettings(prev => ({ ...prev, metaDescription: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Palavras-chave</Label>
            <Input
              id="keywords"
              placeholder="direito, jurídico, advogados..."
              value={settings.keywords}
              onChange={(e) => 
                setSettings(prev => ({ ...prev, keywords: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Separe as palavras-chave com vírgulas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="google-analytics" className="flex items-center gap-2">
              Google Analytics ID
              {settings.googleAnalyticsId && (
                <Check className="h-4 w-4 text-green-500" />
              )}
            </Label>
            <div className="relative">
              <Input
                id="google-analytics"
                placeholder="G-XXXXXXXXXX"
                value={settings.googleAnalyticsId}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, googleAnalyticsId: e.target.value }))
                }
                className={settings.googleAnalyticsId ? "pr-10" : ""}
              />
              {settings.googleAnalyticsId && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {settings.googleAnalyticsId 
                ? "✓ Google Analytics configurado" 
                : "Cole aqui o ID do seu Google Analytics"
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configurações Avançadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Configurações Avançadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="canonical-url">URL Canônica Base</Label>
            <Input
              id="canonical-url"
              placeholder="https://seudominio.com"
              value={settings.canonicalUrl}
              onChange={(e) => 
                setSettings(prev => ({ ...prev, canonicalUrl: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="social-image">Imagem Social Padrão (Open Graph)</Label>
            <Input
              id="social-image"
              placeholder="https://seudominio.com/og-image.jpg"
              value={settings.socialImage}
              onChange={(e) => 
                setSettings(prev => ({ ...prev, socialImage: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="favicon">Favicon URL</Label>
            <Input
              id="favicon"
              placeholder="https://seudominio.com/favicon.ico"
              value={settings.favicon}
              onChange={(e) => 
                setSettings(prev => ({ ...prev, favicon: e.target.value }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          className="px-8" 
          disabled={isLoading}
        >
          {isLoading ? "Salvando..." : isSaved ? "✓ Salvo" : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
}