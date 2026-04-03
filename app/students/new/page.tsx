"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createStudent, uploadAthletePhoto, updateStudent } from "@/lib/storage";
import { validateAthletePhoto } from "@/lib/photoValidation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, UserPlus, Camera } from "lucide-react";
import { toast } from "sonner";

export default function NewStudentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    age: "",
    weight: "",
    height: "",
    objective: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateAthletePhoto(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setLoading(true);
    try {
      // 1. Cria o atleta
      const student = await createStudent({
        name: form.name.trim(),
        age: Number(form.age) || 0,
        weight: Number(form.weight) || 0,
        height: Number(form.height) || 0,
        objective: form.objective.trim(),
        photoUrl: null,
      });

      // 2. Se selecionou foto, faz upload e salva a URL
      if (photoFile) {
        try {
          const photoUrl = await uploadAthletePhoto(student.id, photoFile);
          await updateStudent(student.id, { photoUrl });
        } catch {
          toast.warning("Atleta criado, mas falha ao enviar a foto. Você pode adicioná-la depois.");
        }
      }

      toast.success(`Aluno ${student.name} cadastrado com sucesso!`);
      router.push(`/students/${student.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao cadastrar aluno");
      setLoading(false);
    }
  };

  const initials = form.name.trim().split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <h1 className="font-heading text-3xl font-bold text-foreground tracking-wide">NOVO ALUNO</h1>
        <p className="text-muted-foreground text-sm mt-1">Preencha os dados do aluno para começar</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">

          {/* Foto */}
          <div className="flex flex-col items-center gap-3 pb-2">
            <div className="relative group">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-full overflow-hidden bg-brand-blue-dark border-2 border-border hover:border-brand-blue-light transition-colors cursor-pointer flex items-center justify-center relative"
              >
                {photoPreview ? (
                  <Image
                    src={photoPreview}
                    alt="Pré-visualização"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="font-heading text-2xl font-bold text-brand-blue-light select-none">
                    {initials}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-brand-blue-light hover:text-brand-yellow-glow text-xs font-medium cursor-pointer transition-colors"
            >
              {photoPreview ? "Trocar foto" : "Adicionar foto (opcional)"}
            </button>
            <p className="text-muted-foreground text-xs">JPG, PNG ou WebP · máx. 5 MB</p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
              Nome Completo *
            </Label>
            <Input
              id="name"
              placeholder="Ex: João Silva"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-brand-blue-light h-11"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age" className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
                Idade
              </Label>
              <Input
                id="age"
                type="number"
                placeholder="25"
                min={1}
                max={99}
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-brand-blue-light h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight" className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
                Peso (kg)
              </Label>
              <Input
                id="weight"
                type="number"
                placeholder="75"
                step="0.1"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-brand-blue-light h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height" className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
                Altura (cm)
              </Label>
              <Input
                id="height"
                type="number"
                placeholder="175"
                step="0.1"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-brand-blue-light h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="objective" className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
              Objetivo
            </Label>
            <Textarea
              id="objective"
              placeholder="Ex: Melhorar performance no futebol, aumentar altura de salto..."
              value={form.objective}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-brand-blue-light resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="bg-brand-blue-mid hover:bg-brand-blue-dark text-white font-bold cursor-pointer flex-1 h-11 text-base"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              {loading ? "Salvando..." : "Cadastrar Aluno"}
            </Button>
            <Link href="/dashboard">
              <Button
                type="button"
                variant="outline"
                className="border-border text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer h-11"
              >
                Cancelar
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
