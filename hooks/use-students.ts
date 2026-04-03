"use client";

import { useState, useEffect, useCallback } from "react";
import { getStudents } from "@/lib/storage";
import { Student } from "@/lib/types";

interface UseStudentsResult {
  students: Student[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useStudents(): UseStudentsResult {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStudents();
      setStudents(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao carregar alunos";
      setError(msg);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { students, loading, error, refresh };
}
