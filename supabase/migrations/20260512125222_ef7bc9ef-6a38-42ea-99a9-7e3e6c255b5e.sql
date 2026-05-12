ALTER TABLE public.avarias_registros REPLICA IDENTITY FULL;
ALTER TABLE public.avarias_importacoes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.avarias_registros;
ALTER PUBLICATION supabase_realtime ADD TABLE public.avarias_importacoes;