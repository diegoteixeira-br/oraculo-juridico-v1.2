-- Corrigir a função update_user_agenda_schedule para funcionar apenas com notification_settings
CREATE OR REPLACE FUNCTION public.update_user_agenda_schedule()
RETURNS TRIGGER AS $$
BEGIN
  -- Esta função agora só funciona com a tabela notification_settings
  -- Remover qualquer lógica que tente acessar campos que não existem
  
  -- Se for um UPDATE na tabela notification_settings
  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'notification_settings' THEN
    -- Apenas continuar o update normalmente
    RETURN NEW;
  END IF;
  
  -- Para qualquer outro caso, apenas retornar NEW
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;