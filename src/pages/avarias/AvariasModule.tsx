import { useState } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, Upload, History, FileText } from "lucide-react";
import DashboardTab from "./DashboardTab";
import ImportTab from "./ImportTab";
import HistoricoTab from "./HistoricoTab";
import RelatoriosTab from "./RelatoriosTab";

export default function AvariasModule() {
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="-ml-2">
              <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Módulo de Análises de Avarias da MC</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Importação, análise e gestão executiva de avarias por contrato
              </p>
            </div>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard"><BarChart3 className="h-4 w-4 mr-2" />Dashboard</TabsTrigger>
            <TabsTrigger value="import"><Upload className="h-4 w-4 mr-2" />Importar Planilha</TabsTrigger>
            <TabsTrigger value="historico"><History className="h-4 w-4 mr-2" />Histórico</TabsTrigger>
            <TabsTrigger value="relatorios"><FileText className="h-4 w-4 mr-2" />Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><DashboardTab /></TabsContent>
          <TabsContent value="import"><ImportTab onImported={() => setTab("dashboard")} /></TabsContent>
          <TabsContent value="historico"><HistoricoTab /></TabsContent>
          <TabsContent value="relatorios"><RelatoriosTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
