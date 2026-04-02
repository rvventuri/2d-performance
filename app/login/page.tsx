"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    const supabase = createClient();

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMsg(
          "Conta criada! Verifique seu e-mail para confirmar o cadastro, depois faça login."
        );
        setMode("login");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      if (msg.includes("Invalid login credentials")) {
        setError("E-mail ou senha incorretos.");
      } else if (msg.includes("Email not confirmed")) {
        setError("Confirme seu e-mail antes de fazer login.");
      } else if (msg.includes("User already registered")) {
        setError("Este e-mail já está cadastrado. Faça login.");
        setMode("login");
      } else if (msg.includes("Password should be")) {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#020617]">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-blue-mid/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logosemfundo.png"
            alt="2D Performance"
            width={220}
            height={88}
            className="w-52 sm:w-56 h-auto object-contain mb-3"
            priority
          />
          <p className="text-[#94A3B8] text-sm mt-1">
            Plataforma de avaliação esportiva
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 shadow-2xl">
          <h2 className="font-heading text-xl font-bold text-white mb-1">
            {mode === "login" ? "ENTRAR" : "CRIAR CONTA"}
          </h2>
          <p className="text-[#94A3B8] text-sm mb-6">
            {mode === "login"
              ? "Acesse sua conta para continuar"
              : "Crie sua conta gratuitamente"}
          </p>

          {successMsg && (
            <div className="mb-4 p-3 bg-brand-blue-mid/15 border border-brand-blue-light/30 rounded-lg">
              <p className="text-brand-yellow-glow text-sm">{successMsg}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg">
              <p className="text-[#FCA5A5] text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-[#94A3B8] text-xs font-medium uppercase tracking-wider"
              >
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="treinador@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-[#1E293B] border-[#1E293B] text-white placeholder:text-[#475569] focus:border-brand-blue-light h-11"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-[#94A3B8] text-xs font-medium uppercase tracking-wider"
              >
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "signup" ? "Mínimo 6 caracteres" : "••••••••"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="bg-[#1E293B] border-[#1E293B] text-white placeholder:text-[#475569] focus:border-brand-blue-light h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94A3B8] cursor-pointer transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-brand-blue-mid hover:bg-brand-blue-dark text-white font-bold cursor-pointer text-base mt-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === "login" ? "Entrando..." : "Criando conta..."}
                </>
              ) : mode === "login" ? (
                "Entrar"
              ) : (
                "Criar Conta"
              )}
            </Button>
          </form>

          <div className="mt-5 pt-5 border-t border-[#1E293B] text-center">
            {mode === "login" ? (
              <p className="text-[#94A3B8] text-sm">
                Não tem conta?{" "}
                <button
                  onClick={() => { setMode("signup"); setError(""); setSuccessMsg(""); }}
                  className="text-brand-blue-light hover:text-brand-yellow-glow font-semibold cursor-pointer transition-colors"
                >
                  Criar conta
                </button>
              </p>
            ) : (
              <p className="text-[#94A3B8] text-sm">
                Já tem conta?{" "}
                <button
                  onClick={() => { setMode("login"); setError(""); setSuccessMsg(""); }}
                  className="text-brand-blue-light hover:text-brand-yellow-glow font-semibold cursor-pointer transition-colors"
                >
                  Fazer login
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
