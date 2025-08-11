-- Padronização de formatação dos modelos (legal_documents)
-- 1) Adicionar colunas para controle de margens e tamanho do papel
ALTER TABLE public.legal_documents
ADD COLUMN IF NOT EXISTS paper_id TEXT DEFAULT 'A4';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'legal_documents_paper_id_check'
  ) THEN
    ALTER TABLE public.legal_documents
    ADD CONSTRAINT legal_documents_paper_id_check
    CHECK (paper_id IN ('A4','OFICIO','LEGAL'));
  END IF;
END $$;

ALTER TABLE public.legal_documents
ADD COLUMN IF NOT EXISTS margins JSONB DEFAULT '{"top":10,"right":10,"bottom":24,"left":10}'::jsonb;

-- 2) Backfill para todos os modelos existentes
UPDATE public.legal_documents
SET 
  paper_id = COALESCE(paper_id, 'A4'),
  margins = COALESCE(margins, '{"top":10,"right":10,"bottom":24,"left":10}'::jsonb);

-- 3) Limpeza de páginas em branco: remover espaços em branco e marcadores vazios ao final
-- Remover espaços em branco no fim do conteúdo
UPDATE public.legal_documents
SET content = regexp_replace(content, E'\\s+\\z', '', 'g');

-- Remover parágrafos vazios no final (ex.: <p>\n</p>, <p><br></p>)
UPDATE public.legal_documents
SET content = regexp_replace(
  content,
  E'((<p>\\s*(<br\\s*/?>)?\\s*</p>)|(<p>\\s*</p>))+\\s*\\z',
  '',
  'gi'
);

-- Remover marcadores de quebra de página no final (ex.: <div class="page-break"></div> ou <hr/>)
UPDATE public.legal_documents
SET content = regexp_replace(
  content,
  E'((<div\\s+class=\"page-break\"\\s*>\\s*</div>)|(<hr\\s*/?>))+\\s*\\z',
  '',
  'gi'
);

-- 4) Garantir trigger de updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_legal_documents_updated_at'
  ) THEN
    CREATE TRIGGER update_legal_documents_updated_at
    BEFORE UPDATE ON public.legal_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_legal_documents_updated_at();
  END IF;
END $$;