import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TestTube, Clock, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TestAgendaEmail from "@/components/TestAgendaEmail";
import UserMenu from "@/components/UserMenu";

const TesteAgenda = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm">
        <div className="container max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="text-white hover:bg-slate-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img 
                src="/lovable-uploads/78181766-45b6-483a-866f-c4e0e4deff74.png" 
                alt="Oráculo Jurídico" 
                className="h-8 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <TestTube className="h-5 w-5 text-primary" />
                  Teste de Notificações da Agenda
                </h1>
              </div>
            </div>
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Test Component */}
          <div>
            <TestAgendaEmail />
          </div>

          {/* Instructions */}
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Clock className="w-5 h-5 text-primary" />
                  Como Testar
                </CardTitle>
                <CardDescription>
                  Instruções para testar o sistema de notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="text-slate-300 space-y-3">
                <div>
                  <h4 className="font-semibold text-white mb-2">1. Configurar Notificações</h4>
                  <p className="text-sm">
                    Vá em "Minha Conta" e ative "Receber notificações da agenda" 
                    e configure o horário preferido.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-white mb-2">2. Criar Compromissos</h4>
                  <p className="text-sm">
                    Adicione alguns compromissos na agenda para as próximas 24 horas.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-white mb-2">3. Executar Teste</h4>
                  <p className="text-sm">
                    Use o botão "Enviar Teste Agora" para simular o envio automático.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Mail className="w-5 h-5 text-primary" />
                  Sobre as Notificações
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 space-y-2">
                <div className="text-sm space-y-2">
                  <p>• <strong>Horário:</strong> Configurável no perfil do usuário</p>
                  <p>• <strong>Frequência:</strong> Diária, no horário escolhido</p>
                  <p>• <strong>Conteúdo:</strong> Compromissos das próximas 24h</p>
                  <p>• <strong>Timezone:</strong> Respeita o fuso horário do usuário</p>
                  <p>• <strong>Filtros:</strong> Apenas compromissos com status "pendente"</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TesteAgenda;