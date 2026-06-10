import { PageHeader } from "@/components/AppLayout";
import HistoricoTab from "./HistoricoTab";

export default function HistoricoPage() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-5">
      <PageHeader
        title="Histórico de Importações"
        subtitle="Lotes de avarias importados para o módulo."
      />
      <HistoricoTab />
    </div>
  );
}
