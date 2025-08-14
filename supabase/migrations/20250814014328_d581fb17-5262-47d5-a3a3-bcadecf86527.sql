-- Adicionar campo timezone à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN timezone TEXT DEFAULT 'America/Sao_Paulo';

-- Comentário para explicar os valores válidos
COMMENT ON COLUMN public.profiles.timezone IS 'Fuso horário do usuário usando identificadores IANA (ex: America/Sao_Paulo, America/Cuiaba, America/Manaus, America/Campo_Grande)';