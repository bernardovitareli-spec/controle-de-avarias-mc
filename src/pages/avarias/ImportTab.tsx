import { Card, CardContent } from "@/components/ui/card";
import { Upload } from "lucide-react";

export default function ImportTab({ onImported }: { onImported: () => void }) {
  return (
    <Card>
      <CardContent className="p-10 text-center text-muted-foreground">
        <Upload className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium text-foreground">Importação de Planilhas</p>
        <p className="text-sm mt-1">
          Será implementada na <strong>Etapa 2</strong>: upload .xlsx/.xls/.csv, leitura multi-aba,
          prévia com totais e validações antes de confirmar a gravação no banco.
        </p>
      </CardContent>
    </Card>
  );
}
