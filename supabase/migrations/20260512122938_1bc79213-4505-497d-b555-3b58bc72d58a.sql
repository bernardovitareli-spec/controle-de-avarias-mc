
-- Importações
CREATE TABLE public.avarias_importacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_arquivo TEXT NOT NULL,
  usuario_id UUID,
  data_importacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_linhas_lidas INT NOT NULL DEFAULT 0,
  total_registros_validos INT NOT NULL DEFAULT 0,
  total_registros_ignorados INT NOT NULL DEFAULT 0,
  total_duplicados INT NOT NULL DEFAULT 0,
  valor_total_importado NUMERIC(14,2) NOT NULL DEFAULT 0,
  status_importacao TEXT NOT NULL DEFAULT 'confirmada',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Registros
CREATE TABLE public.avarias_registros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  importacao_id UUID NOT NULL REFERENCES public.avarias_importacoes(id) ON DELETE CASCADE,
  data_envio DATE,
  placa TEXT,
  contrato TEXT,
  status_original TEXT,
  status_normalizado TEXT,
  nf_mc TEXT,
  valor NUMERIC(14,2) NOT NULL DEFAULT 0,
  parecer_original TEXT,
  parecer_normalizado TEXT,
  observacoes TEXT,
  categoria TEXT,
  subcategoria TEXT,
  chave_duplicidade TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_avarias_contrato ON public.avarias_registros(contrato);
CREATE INDEX idx_avarias_placa ON public.avarias_registros(placa);
CREATE INDEX idx_avarias_importacao ON public.avarias_registros(importacao_id);
CREATE INDEX idx_avarias_chave_dup ON public.avarias_registros(chave_duplicidade);
CREATE INDEX idx_avarias_data_envio ON public.avarias_registros(data_envio);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_imp_updated BEFORE UPDATE ON public.avarias_importacoes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_reg_updated BEFORE UPDATE ON public.avarias_registros
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS (acesso aberto nesta fase; pode ser endurecido com auth depois)
ALTER TABLE public.avarias_importacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avarias_registros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open_all_imp" ON public.avarias_importacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_reg" ON public.avarias_registros FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avarias-uploads', 'avarias-uploads', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avarias_uploads_read" ON storage.objects FOR SELECT USING (bucket_id = 'avarias-uploads');
CREATE POLICY "avarias_uploads_write" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avarias-uploads');
CREATE POLICY "avarias_uploads_update" ON storage.objects FOR UPDATE USING (bucket_id = 'avarias-uploads');
CREATE POLICY "avarias_uploads_delete" ON storage.objects FOR DELETE USING (bucket_id = 'avarias-uploads');
