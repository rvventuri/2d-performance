"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
            Algo deu errado
          </h2>
          <p className="text-muted-foreground text-sm">
            Ocorreu um erro inesperado. Se o problema persistir, entre em contato com o suporte.
          </p>
          {error.digest && (
            <p className="text-muted-foreground/50 text-xs mt-2 font-mono">
              ID: {error.digest}
            </p>
          )}
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={reset}
            variant="outline"
            className="border-border text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
          <Link href="/dashboard">
            <Button className="bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground cursor-pointer">
              <Home className="w-4 h-4 mr-2" />
              Ir para o Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
