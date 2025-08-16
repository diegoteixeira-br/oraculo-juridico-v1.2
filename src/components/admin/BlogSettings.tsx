import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Settings, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BlogSettings() {
  const [settings, setSettings] = useState({
    googleAdsenseClientId: "ca-pub-5971738175423899",
    googleAdsenseEnabled: true,
    googleAnalyticsId: "",
    metaTitle: "Blog Jurídico - Oráculo Jurídico",
    metaDescription: "Artigos especializados em direito e jurisprudência",
    keywords: "direito, jurídico, advogados, legislação, jurisprudência",
    favicon: "",
    socialImage: "",
    canonicalUrl: "",
  });
  
  const { toast } = useToast();

  const handleSave = () => {
    // Aqui você salvaria as configurações no backend
    toast({
      title: "Configurações salvas",
      description: "As configurações do blog foram atualizadas com sucesso.",
    });
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
              <Label htmlFor="adsense-client">ID do Cliente AdSense</Label>
              <Input
                id="adsense-client"
                placeholder="ca-pub-xxxxxxxxxxxxxxxxx"
                value={settings.googleAdsenseClientId}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, googleAdsenseClientId: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Encontre seu ID do cliente na sua conta do Google AdSense
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
            <Label htmlFor="google-analytics">Google Analytics ID</Label>
            <Input
              id="google-analytics"
              placeholder="G-XXXXXXXXXX"
              value={settings.googleAnalyticsId}
              onChange={(e) => 
                setSettings(prev => ({ ...prev, googleAnalyticsId: e.target.value }))
              }
            />
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
        <Button onClick={handleSave} className="px-8">
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}