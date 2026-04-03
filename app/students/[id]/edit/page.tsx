"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getStudent, updateStudent, uploadAthletePhoto, deleteAthletePhoto } from "@/lib/storage";
import { validateAthletePhoto } from "@/lib/photoValidation";
import { Student } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2, Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [student, setStudent] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [form, setForm] = useState({
    name: "",
    age: "",
    weight: "",
    height: "",
    objective: "",
  });

  useEffect(() => {
    getStudent(id).then((s) => {
      if (!s) { router.push("/dashboard"); return; }
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateAthletePhoto(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setPhotoFile(file);
    setRemovePhoto(false);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setRemovePhoto(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    try {
      let photoUrl: string | null | undefined = undefined;

      if (photoFile) {
        photoUrl = await uploadAthletePhoto(id, photoFile);
      } else if (removePhoto) {
        await deleteAthletePhoto(id);
        photoUrl = null;
      }

      await updateStudent(id, {
        name: form.name.trim(),
        age: Number(form.age) || 0,
        weight: Number(form.weight) || 0,
        height: Number(form.height) || 0,
        objective: form.objective.trim(),
        ...(photoUrl !== undefined && { photoUrl }),
      });
      toast.success("Aluno atualizado com sucesso!");
      router.push(`/students/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
      setSaving(false);
    }
  };

  const currentPhoto = photoPreview ?? (removePhoto ? null : student?.photoUrl ?? null);
  const initials = form.name?.trim().split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

  if (!student) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-brand-blue-light" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Link href={`/students/${id}`}>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <h1 className="font-heading text-3xl font-bold text-foreground tracking-wide">EDITAR ALUNO</h1>
        <p className="text-muted-foreground text-sm mt-1">{student.name}</p>
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
                {currentPhoto ? (
                  <Image
                    src={currentPhoto}
                    alt="Foto do atleta"
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

              {currentPhoto && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-[#EF4444] rounded-full flex items-center justify-center hover:bg-[#DC2626] transition-colors cursor-pointer"
                  title="Remover foto"
                >
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-brand-blue-light hover:text-brand-yellow-glow text-xs font-medium cursor-pointer transition-colors"
            >
              {currentPhoto ? "Trocar foto" : "Adicionar foto"}
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
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-brand-blue-light h-11"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age" className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Idade</Label>
              <Input
                id="age"
                type="number"
                min={1}
                max={99}
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                className="bg-secondary border-border text-foreground focus:border-brand-blue-light h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight" className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                className="bg-secondary border-border text-foreground focus:border-brand-blue-light h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height" className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Altura (cm)</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                className="bg-secondary border-border text-foreground focus:border-brand-blue-light h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="objective" className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Objetivo</Label>
            <Textarea
              id="objective"
              value={form.objective}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
              className="bg-secondary border-border text-foreground focus:border-brand-blue-light resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="bg-brand-blue-mid hover:bg-brand-blue-dark text-white font-bold cursor-pointer flex-1 h-11"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
            <Link href={`/students/${id}`}>
              <Button type="button" variant="outline" className="border-border text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer h-11">
                Cancelar
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
