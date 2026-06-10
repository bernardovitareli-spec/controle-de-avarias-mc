import { useState } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Upload, History, FileDown } from "lucide-react";
import ImportTab from "./ImportTab";
import HistoricoTab from "./HistoricoTab";
import { AppHeader } from "@/components/AppHeader";
import { useUserRole } from "@/hooks/useUserRole";

export default function AvariasModule() {
  const { podeImportar } = useUserRole();
  const [tab, setTab] = useState(podeImportar ? "import" : "historico");

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        actions={
          <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
            <Link to="/"><LayoutDashboard className="h-4 w-4 mr-1.5" /> Abrir Dashboard</Link>
          </Button>
        }
      />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Módulo de Avarias</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Importação, conferência e histórico de lotes de avarias.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            {podeImportar && (
              <TabsTrigger value="import"><Upload className="h-4 w-4 mr-2" />Importar Planilha</TabsTrigger>
            )}
            <TabsTrigger value="historico"><History className="h-4 w-4 mr-2" />Histórico</TabsTrigger>
          </TabsList>

          {podeImportar && (
            <TabsContent value="import"><ImportTab onImported={() => setTab("historico")} /></TabsContent>
          )}
          <TabsContent value="historico"><HistoricoTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
