import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminUsuarios from "./pages/AdminUsuarios.tsx";
import Login from "./pages/Login.tsx";
import AvariasListPage from "./pages/avarias/AvariasListPage.tsx";
import ImportPage from "./pages/avarias/ImportPage.tsx";
import HistoricoPage from "./pages/avarias/HistoricoPage.tsx";
import RelatoriosPage from "./pages/RelatoriosPage.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { AppLayout } from "./components/AppLayout.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Index />} />
              <Route path="/avarias" element={<AvariasListPage />} />
              <Route path="/avarias/importar" element={<ImportPage />} />
              <Route path="/avarias/historico" element={<HistoricoPage />} />
              <Route path="/relatorios" element={<RelatoriosPage />} />
              <Route path="/admin/usuarios" element={<AdminUsuarios />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
