"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getStudent, updateStudent } from "@/lib/storage";
import { Student } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    age: "",
    weight: "",
    height: "",
    objective: "",
  });

  useEffect(() => {
    getStudent(id).then((s) => {
      if (!s) { router.push("/"); return; }
      setStudent(s);
      setForm({
        name: s.name,
        age: String(s.age || ""),
        weight: String(s.weight || ""),
        height: String(s.height || ""),
        objective: s.objective || "",
      });
    });
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    try {
      await updateStudent(id, {
        name: form.name.trim(),
        age: Number(form.age) || 0,
        weight: Number(form.weight) || 0,
        height: Number(form.height) || 0,
        objective: form.objective.trim(),
      });
      toast.success("Aluno atualizado com sucesso!");
      router.push(`/students/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
      setSaving(false);
    }
  };

  if (!student) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-[#22C55E]" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Link href={`/students/${id}`}>
          <Button variant="ghost" size="sm" className="text-[#94A3B8] hover:text-white hover:bg-[#1E293B] cursor-pointer mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <h1 className="font-heading text-3xl font-bold text-white tracking-wide">EDITAR ALUNO</h1>
        <p className="text-[#94A3B8] text-sm mt-1">{student.name}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[#94A3B8] text-sm font-medium uppercase tracking-wider">
              Nome Completo *
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-[#1E293B] border-[#1E293B] text-white placeholder:text-[#475569] focus:border-[#22C55E] h-11"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age" className="text-[#94A3B8] text-sm font-medium uppercase tracking-wider">Idade</Label>
              <Input
                id="age"
                type="number"
                min={1}
                max={99}
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                className="bg-[#1E293B] border-[#1E293B] text-white focus:border-[#22C55E] h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight" className="text-[#94A3B8] text-sm font-medium uppercase tracking-wider">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                className="bg-[#1E293B] border-[#1E293B] text-white focus:border-[#22C55E] h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height" className="text-[#94A3B8] text-sm font-medium uppercase tracking-wider">Altura (cm)</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                className="bg-[#1E293B] border-[#1E293B] text-white focus:border-[#22C55E] h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="objective" className="text-[#94A3B8] text-sm font-medium uppercase tracking-wider">Objetivo</Label>
            <Textarea
              id="objective"
              value={form.objective}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
              className="bg-[#1E293B] border-[#1E293B] text-white focus:border-[#22C55E] resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-[#020617] font-bold cursor-pointer flex-1 h-11"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
            <Link href={`/students/${id}`}>
              <Button type="button" variant="outline" className="border-[#1E293B] text-[#94A3B8] hover:text-white hover:bg-[#1E293B] cursor-pointer h-11">
                Cancelar
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
