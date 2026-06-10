import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { normalizeParecer } from "@/modules/avarias/normalize";

export interface EditAvariaTarget {
  id: string;
  placa: string;
  nf: string;
  parecer: string;
  observacoes: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  target: EditAvariaTarget | null;
}

export function EditAvariaDialog({ open, onOpenChange, target }: Props) {
  const { isAdmin, isGestor, isApontador } = useUserRole();
  const qc = useQueryClient();
  const showObservacoes = isAdmin || isGestor;

  const [nf, setNf] = useState("");
  const [parecer, setParecer] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (target) {
      setNf(target.nf ?? "");
      setParecer(target.parecer ?? "");
      setObservacoes(target.observacoes ?? "");
    }
  }, [target]);

  const handleSave = async () => {
    if (!target) return;
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        nf_mc: nf || null,
        parecer_original: parecer || null,
        parecer_normalizado: normalizeParecer(parecer),
      };
      if (showObservacoes) {
        payload.observacoes = observacoes || null;
      }

      const { error } = await supabase
        .from("avarias_registros")
        .update(payload as any)
        .eq("id", target.id);
      if (error) throw error;

      toast.success("Avaria atualizada");
      await qc.invalidateQueries({ queryKey: ["avarias"] });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao atualizar avaria");
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin && !isGestor && !isApontador) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar avaria</DialogTitle>
          {target?.placa && (
            <DialogDescription>Placa {target.placa}</DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-nf">NF</Label>
            <Input id="edit-nf" value={nf} onChange={(e) => setNf(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-parecer">Parecer</Label>
            <Input
              id="edit-parecer"
              value={parecer}
              onChange={(e) => setParecer(e.target.value)}
              placeholder="Ex.: Concluído, À Negociar..."
            />
          </div>
          {showObservacoes && (
            <div className="space-y-1.5">
              <Label htmlFor="edit-obs">Observações</Label>
              <Textarea
                id="edit-obs"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={4}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditAvariaDialog;
