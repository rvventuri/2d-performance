"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getStudents, getStudentAssessments } from "@/lib/storage";
import { Student } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, Plus, User, ChevronRight,
  Activity, Calendar, TrendingUp, Users, Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function Dashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [assessmentCounts, setAssessmentCounts] = useState<Record<string, number>>({});
  const [lastDates, setLastDates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getStudents();
      setStudents(all);
      const counts: Record<string, number> = {};
      const dates: Record<string, string> = {};
      await Promise.all(
        all.map(async (s) => {
          const ass = await getStudentAssessments(s.id);
          counts[s.id] = ass.length;
          if (ass.length > 0) dates[s.id] = ass[ass.length - 1].date;
        })
      );
      setAssessmentCounts(counts);
      setLastDates(dates);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao carregar alunos";
      toast.error(msg);
      setStudents([]);
      setAssessmentCounts({});
      setLastDates({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold text-white tracking-wide mb-1">DASHBOARD</h1>
        <p className="text-[#94A3B8] text-sm">Gerencie seus alunos e acompanhe a evolução de performance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Users, color: "#22C55E", label: "Alunos", value: students.length },
          { icon: Activity, color: "#3B82F6", label: "Avaliações", value: Object.values(assessmentCounts).reduce((a, b) => a + b, 0) },
          { icon: TrendingUp, color: "#F59E0B", label: "Com histórico", value: Object.values(assessmentCounts).filter((c) => c >= 2).length },
        ].map(({ icon: Icon, color, label, value }, i) => (
          <div key={i} className={`bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 ${i === 2 ? "col-span-2 sm:col-span-1" : ""}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}1a` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="text-[#94A3B8] text-xs font-medium uppercase tracking-wider">{label}</p>
                <p className="font-heading text-2xl font-bold text-white">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#475569]" /> : value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + New */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <Input
            placeholder="Buscar aluno..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#0F172A] border-[#1E293B] text-white placeholder:text-[#475569] focus:border-[#22C55E] transition-colors"
          />
        </div>
        <Link href="/students/new">
          <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-[#020617] font-semibold cursor-pointer shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Novo Aluno
          </Button>
        </Link>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#22C55E]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-[#0F172A] border border-[#1E293B] rounded-xl">
          {students.length === 0 ? (
            <>
              <div className="w-16 h-16 bg-[#1E293B] rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[#94A3B8]" />
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-2">Nenhum aluno cadastrado</h3>
              <p className="text-[#94A3B8] text-sm mb-6">Comece cadastrando seu primeiro aluno para iniciar as avaliações.</p>
              <Link href="/students/new">
                <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-[#020617] font-semibold cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Primeiro Aluno
                </Button>
              </Link>
            </>
          ) : (
            <p className="text-[#94A3B8]">Nenhum aluno encontrado para &ldquo;{search}&rdquo;</p>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((student) => {
            const count = assessmentCounts[student.id] ?? 0;
            const lastDate = lastDates[student.id];
            return (
              <Link key={student.id} href={`/students/${student.id}`}>
                <div className="bg-[#0F172A] border border-[#1E293B] hover:border-[#22C55E]/40 rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all duration-200 group">
                  <div className="w-12 h-12 bg-[#1E293B] rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[#22C55E]/10 transition-colors">
                    <User className="w-6 h-6 text-[#94A3B8] group-hover:text-[#22C55E] transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-heading text-lg font-bold text-white truncate">{student.name}</h3>
                      <Badge variant="secondary" className="bg-[#1E293B] text-[#94A3B8] text-xs border-0 shrink-0">
                        {student.age} anos
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#94A3B8]">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {count} {count === 1 ? "avaliação" : "avaliações"}
                      </span>
                      {lastDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Última: {formatDate(lastDate)}
                        </span>
                      )}
                      {student.objective && (
                        <span className="hidden sm:block truncate max-w-xs">{student.objective}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {count >= 2 && (
                      <Badge className="bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20 text-xs hidden sm:flex">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Histórico
                      </Badge>
                    )}
                    <ChevronRight className="w-5 h-5 text-[#1E293B] group-hover:text-[#22C55E] transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
