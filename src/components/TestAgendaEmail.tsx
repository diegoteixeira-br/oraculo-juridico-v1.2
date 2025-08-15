import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, CheckCircle, AlertCircle, Users, Eye, Code, Save, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const defaultTemplate = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Resumo da Agenda Jurídica</title>
    <style>
        body {
            margin: 0;
            padding: 24px;
            background-color: #f8fafc;
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
        }
        .container {
            max-width: 640px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #1e3a8a, #312e81);
            color: #ffffff;
            padding: 24px;
            text-align: center;
        }
        .header h1 {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 8px 0;
            letter-spacing: 0.5px;
        }
        .header p {
            font-size: 14px;
            opacity: 0.9;
            margin: 0;
        }
        .content {
            padding: 32px 24px;
            color: #0f172a;
        }
        .greeting {
            font-size: 16px;
            margin: 0 0 24px 0;
            line-height: 1.6;
        }
        .commitments {
            margin: 24px 0;
        }
        .commitment {
            background: #f8fafc;
            border-left: 4px solid #1e3a8a;
            padding: 16px;
            margin: 12px 0;
            border-radius: 8px;
        }
        .commitment-title {
            font-weight: 600;
            color: #1e3a8a;
            font-size: 16px;
            margin: 0 0 8px 0;
        }
        .commitment-time {
            color: #374151;
            font-size: 14px;
            margin: 4px 0;
        }
        .commitment-details {
            color: #6b7280;
            font-size: 13px;
            margin: 8px 0 0 0;
        }
        .footer {
            border-top: 1px solid #e5e7eb;
            padding: 20px 24px;
            background: #f9fafb;
            color: #6b7280;
            font-size: 12px;
            text-align: center;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{SITE_NAME}}</h1>
            <p>Resumo da Agenda Jurídica</p>
        </div>
        
        <div class="content">
            <p class="greeting">
                Olá{{USER_NAME}}! 
                Aqui está o seu resumo de compromissos nas próximas 24 horas:
            </p>
            
            <div class="commitments">
                {{COMMITMENTS}}
            </div>
        </div>
        
        <div class="footer">
            Você está recebendo este e-mail porque ativou notificações de agenda no {{SITE_NAME}}.<br>
            Para gerenciar suas notificações, acesse sua conta.
        </div>
    </div>
</body>
</html>`;

const TestAgendaEmail = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [testEmail, setTestEmail] = useState('');
  const [emailTemplate, setEmailTemplate] = useState(defaultTemplate);
  const [activeTab, setActiveTab] = useState('source');
  const [saveLoading, setSaveLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  const testEmailNotification = async (specificEmail?: string) => {
    setLoading(true);
    setResult(null);
    
    try {
      const body = specificEmail 
        ? { source: 'manual_test', test_email: specificEmail, template: emailTemplate }
        : { source: 'manual_test', template: emailTemplate };
        
      const { data, error } = await supabase.functions.invoke('daily-agenda-summary', {
        body
      });

      if (error) throw error;

      setResult(data);
      
      if (data.sent > 0) {
        const target = specificEmail ? `para ${specificEmail}` : '';
        toast.success(`✅ ${data.sent} email(s) enviado(s) ${target} com sucesso!`);
      } else {
        toast.info("ℹ️ Nenhum email enviado (sem compromissos ou usuário sem notificação ativa)");
      }
    } catch (error) {
      console.error('Erro ao testar notificação:', error);
      toast.error("❌ Erro ao enviar teste de notificação");
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTestSpecificEmail = () => {
    if (!testEmail.trim()) {
      toast.error("Digite um email válido");
      return;
    }
    testEmailNotification(testEmail.trim());
  };

  const openPreview = () => {
    const previewUrl = `https://uujoxoxsbvhcmcgfvpvi.supabase.co/functions/v1/daily-agenda-summary?preview=true`;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = previewUrl;
    form.target = '_blank';
    
    const templateInput = document.createElement('input');
    templateInput.type = 'hidden';
    templateInput.name = 'template';
    templateInput.value = emailTemplate;
    
    form.appendChild(templateInput);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const loadEmailTemplate = async () => {
    try {
      const saved = localStorage.getItem('agenda_email_template');
      if (saved) {
        setEmailTemplate(saved);
      }
      const savedLogo = localStorage.getItem('agenda_email_logo_url');
      if (savedLogo) {
        setLogoUrl(savedLogo);
      }
    } catch (error) {
      console.log('Template padrão será usado');
    }
  };

  const saveEmailTemplate = async () => {
    setSaveLoading(true);
    try {
      localStorage.setItem('agenda_email_template', emailTemplate);
      localStorage.setItem('agenda_email_logo_url', logoUrl);
      toast.success('✅ Template e logo salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast.error('❌ Erro ao salvar template');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      toast.error('❌ Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Verificar tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('❌ Arquivo muito grande. Máximo 2MB');
      return;
    }

    setUploadLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('email-logos')
        .upload(fileName, file);

      if (error) throw error;

      // Gerar URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('email-logos')
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);
      toast.success('✅ Logo enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('❌ Erro ao enviar arquivo');
    } finally {
      setUploadLoading(false);
    }
  };

  const getPreviewWithData = () => {
    const sampleData = {
      '{{SITE_NAME}}': 'Cakto',
      '{{USER_NAME}}': ', João Silva',
      '{{COMMITMENTS}}': `<div class="commitment">
<div class="commitment-title">Audiência Trabalhista</div>
<div class="commitment-time">📅 15/08/2025, 14:30</div>
<div class="commitment-details">Processo: 1234567-89.2024.5.02.0001 • Cliente: Maria da Silva • Local: TRT 2ª Região</div>
</div>
<div class="commitment">
<div class="commitment-title">Reunião com Cliente</div>
<div class="commitment-time">📅 15/08/2025, 16:00</div>
<div class="commitment-details">Cliente: Pedro Santos</div>
</div>`
    };

    let preview = emailTemplate;
    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });

    return preview;
  };

  useEffect(() => {
    loadEmailTemplate();
  }, []);

  return (
    <div className="w-full space-y-6">
      {/* Editor de Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Mail className="w-5 h-5 text-primary" />
            Editor de Template do Email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
              <TabsList>
                <TabsTrigger value="source" className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Source
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </TabsTrigger>
              </TabsList>
              
              <Button 
                onClick={saveEmailTemplate} 
                disabled={saveLoading}
                size="sm"
                className="ml-4"
              >
                {saveLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Salvar Template
                  </div>
                )}
              </Button>
            </div>

            <TabsContent value="source" className="mt-4">
              <div className="space-y-4">
                {/* Configuração da Logo */}
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <Label className="text-sm font-medium mb-3 block">Configuração da Logo</Label>
                  
                  {/* Upload de arquivo */}
                  <div className="space-y-3 mb-4 p-3 bg-white rounded border">
                    <Label className="text-sm font-medium text-blue-700">Opção 1: Enviar arquivo da sua máquina</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploadLoading}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {uploadLoading && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm">Enviando...</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Formatos aceitos: PNG, JPG, GIF. Tamanho máximo: 2MB.
                    </p>
                  </div>

                  {/* URL manual */}
                  <div className="space-y-3 p-3 bg-white rounded border">
                    <Label className="text-sm font-medium text-green-700">Opção 2: Usar URL de imagem</Label>
                    <Input
                      type="url"
                      placeholder="https://exemplo.com/logo.png"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Cole a URL de uma imagem já hospedada na internet.
                    </p>
                  </div>

                  {/* Preview da logo atual */}
                  {logoUrl && (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <Label className="text-sm font-medium mb-2 block">Preview da Logo:</Label>
                      <img 
                        src={logoUrl} 
                        alt="Preview da logo" 
                        className="max-h-16 max-w-48 object-contain border rounded"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBzdHJva2U9IiNmNjg0OGYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
                        }}
                      />
                    </div>
                  )}

                  {/* Botão aplicar */}
                  <div className="mt-3">
                    <Button 
                      onClick={() => {
                        if (logoUrl.trim()) {
                          const updatedTemplate = emailTemplate.replace(
                            '<h1>{{SITE_NAME}}</h1>',
                            `<img src="${logoUrl}" alt="{{SITE_NAME}}" style="max-height: 60px; max-width: 200px; height: auto;" />`
                          );
                          setEmailTemplate(updatedTemplate);
                          toast.success('✅ Logo aplicada ao template!');
                        } else {
                          toast.error('❌ Selecione ou cole uma URL para a logo');
                        }
                      }}
                      size="sm"
                      disabled={!logoUrl.trim()}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Aplicar Logo ao Template
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Template HTML</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Use as variáveis: {`{{SITE_NAME}}, {{USER_NAME}}, {{COMMITMENTS}}`}
                  </p>
                  <Textarea
                    value={emailTemplate}
                    onChange={(e) => setEmailTemplate(e.target.value)}
                    className="font-mono text-sm min-h-[400px] max-h-[400px] resize-none"
                    placeholder="Digite o HTML do template..."
                  />
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg text-sm">
                  <h4 className="font-semibold text-blue-900 mb-2">Variáveis disponíveis:</h4>
                  <ul className="space-y-1 text-blue-800">
                    <li><code>{`{{SITE_NAME}}`}</code> - Nome do site (usado como alt da logo)</li>
                    <li><code>{`{{USER_NAME}}`}</code> - Nome do usuário (precedido por vírgula se existir)</li>
                    <li><code>{`{{COMMITMENTS}}`}</code> - Lista HTML dos compromissos</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Preview com dados de exemplo</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Visualização de como o email ficará com dados reais
                  </p>
                  <iframe 
                    srcDoc={getPreviewWithData()}
                    className="w-full h-[400px] rounded-md border border-input"
                    title="Email Preview"
                  />
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg text-sm">
                  <h4 className="font-semibold text-blue-900 mb-2">Preview com dados simulados:</h4>
                  <p className="text-blue-700">Este preview mostra como o email ficará com dados reais de compromissos e informações do usuário.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Teste de Envio */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Send className="w-5 h-5 text-primary" />
            Teste de Envio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
        {/* Teste para email específico */}
        <div className="space-y-3 p-4 bg-slate-50 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-primary" />
            <Label className="font-medium">Teste para usuário específico</Label>
          </div>
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Digite o email do usuário"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full"
            />
            <Button 
              onClick={handleTestSpecificEmail} 
              disabled={loading}
              className="w-full"
              variant="default"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  ENVIAR E-MAIL PARA
                </div>
              )}
            </Button>
          </div>
        </div>

        {result && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              {result.error ? (
                <AlertCircle className="w-4 h-4 text-red-500" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              Resultado do Teste:
            </h4>
            
            {result.error ? (
              <p className="text-red-600 text-sm">{result.error}</p>
            ) : (
              <div className="text-sm space-y-1">
                <p><strong>Usuários processados:</strong> {result.processed_users || 0}</p>
                <p><strong>Emails enviados:</strong> {result.sent || 0}</p>
                <p><strong>Mensagem:</strong> {result.message || 'Teste concluído'}</p>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-slate-500">
          <p><strong>Como funciona:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Busca compromissos das próximas 24h</li>
            <li>Envia apenas para usuários com notificação ativa</li>
            <li>Usa o timezone configurado no perfil</li>
          </ul>
        </div>
      </CardContent>
    </Card>
    </div>
  );
};

export default TestAgendaEmail;