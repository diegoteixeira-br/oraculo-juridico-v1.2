import { Clock, MapPin, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserTimezone } from "@/hooks/useUserTimezone";
import { useNavigate } from "react-router-dom";

const TimezoneInfo = () => {
  const { userTimezone, getCurrentDateInUserTimezone } = useUserTimezone();
  const navigate = useNavigate();
  
  const timezoneLabels: { [key: string]: string } = {
    'America/Sao_Paulo': 'Brasília (GMT-3)',
    'America/Manaus': 'Manaus (GMT-4)',
    'America/Rio_Branco': 'Rio Branco (GMT-5)',
    'America/Noronha': 'Fernando de Noronha (GMT-2)',
    'America/Cuiaba': 'Cuiabá (GMT-4)',
    'America/Recife': 'Recife (GMT-3)',
    'America/Fortaleza': 'Fortaleza (GMT-3)',
    'America/Belem': 'Belém (GMT-3)',
    'America/Campo_Grande': 'Campo Grande (GMT-4)',
    'America/Boa_Vista': 'Boa Vista (GMT-4)'
  };

  return (
    <Card className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-blue-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-blue-200 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Configuração de Fuso Horário
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-blue-300">
            {timezoneLabels[userTimezone] || userTimezone}
          </span>
          <Badge variant="outline" className="text-xs border-blue-400/30 text-blue-300">
            Ativo
          </Badge>
        </div>
        <div className="text-xs text-blue-300/80">
          <div>Hora atual: {getCurrentDateInUserTimezone()}</div>
          <div className="mt-1 text-blue-300/60">
            Todas as datas e horários do sistema são exibidos neste fuso horário.
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/minha-conta')}
          className="w-full bg-blue-600/20 hover:bg-blue-600/30 border-blue-400/30 text-blue-300 hover:text-blue-200"
        >
          <Settings className="w-4 h-4 mr-2" />
          Alterar Fuso Horário
        </Button>
      </CardContent>
    </Card>
  );
};

export default TimezoneInfo;