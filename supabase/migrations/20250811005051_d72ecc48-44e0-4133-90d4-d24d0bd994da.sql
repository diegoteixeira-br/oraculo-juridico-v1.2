-- Add paper_id and margins to user_documents, plus trigger to keep updated_at fresh
ALTER TABLE public.user_documents
ADD COLUMN IF NOT EXISTS paper_id TEXT DEFAULT 'A4';

-- Ensure only allowed values for paper_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_documents_paper_id_check'
  ) THEN
    ALTER TABLE public.user_documents
    ADD CONSTRAINT user_documents_paper_id_check
    CHECK (paper_id IN ('A4','OFICIO','LEGAL'));
  END IF;
END $$;

-- Margins as JSONB with sensible defaults
ALTER TABLE public.user_documents
ADD COLUMN IF NOT EXISTS margins JSONB DEFAULT '{"top":25,"right":25,"bottom":25,"left":25}';

-- Backfill existing rows
UPDATE public.user_documents
SET 
  paper_id = COALESCE(paper_id, 'A4'),
  margins = COALESCE(margins, '{"top":25,"right":25,"bottom":25,"left":25}'::jsonb);

-- Trigger to auto-update updated_at on changes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_documents_updated_at'
  ) THEN
    CREATE TRIGGER update_user_documents_updated_at
    BEFORE UPDATE ON public.user_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;