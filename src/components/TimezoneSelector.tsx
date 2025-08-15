import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Clock, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const TimezoneSelector = () => {
  const { profile, refreshProfile } = useAuth();
  const [selectedTimezone, setSelectedTimezone] = useState(
    (profile as any)?.timezone || 'America/Sao_Paulo'
  );
  const [loading, setLoading] = useState(false);

  const timezones = [
    { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
    { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
    { value: 'America/Rio_Branco', label: 'Rio Branco (GMT-5)' },
    { value: 'America/Noronha', label: 'Fernando de Noronha (GMT-2)' },
    { value: 'America/Cuiaba', label: 'Cuiabá (GMT-4)' },
    { value: 'America/Recife', label: 'Recife (GMT-3)' },
    { value: 'America/Fortaleza', label: 'Fortaleza (GMT-3)' },
    { value: 'America/Belem', label: 'Belém (GMT-3)' },
    { value: 'America/Campo_Grande', label: 'Campo Grande (GMT-4)' },
    { value: 'America/Boa_Vista', label: 'Boa Vista (GMT-4)' }
  ];

  const handleSaveTimezone = async () => {
    if (!profile?.user_id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ timezone: selectedTimezone })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Fuso horário atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar timezone:', error);
      toast.error('Erro ao atualizar fuso horário');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTime = () => {
    return new Date().toLocaleString('pt-BR', { 
      timeZone: selectedTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Configuração de Fuso Horário
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Selecione seu fuso horário:</label>
          <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um fuso horário" />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground bg-secondary/20 p-3 rounded-lg">
          <p><strong>Hora atual neste fuso:</strong> {getCurrentTime()}</p>
          <p className="mt-1">
            Todas as datas e horários dos cálculos serão exibidos neste fuso horário.
          </p>
        </div>

        <Button 
          onClick={handleSaveTimezone} 
          disabled={loading || selectedTimezone === (profile as any)?.timezone}
          className="w-full"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Salvando...' : 'Salvar Configuração'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TimezoneSelector;