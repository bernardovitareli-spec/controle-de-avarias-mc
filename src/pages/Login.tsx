import { useState, FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";

export default function Login() {
  const { user, loading, signIn } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/";

  if (!loading && user) return <Navigate to={from} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) setError(error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-elevated border-border/60">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground grid place-items-center font-bold shadow-card">
              MC
            </div>
            <div>
              <CardTitle className="text-lg leading-tight">MC — Gestão de Avarias</CardTitle>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <ShieldCheck className="h-3 w-3 text-primary" /> Acesso restrito
              </p>
            </div>
          </div>
          <CardDescription>
            Use as credenciais fornecidas pelo administrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Entrando...</>
              ) : (
                <><LogIn className="h-4 w-4 mr-2" /> Entrar</>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center pt-2">
              Não há cadastro público. Solicite acesso ao administrador.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
