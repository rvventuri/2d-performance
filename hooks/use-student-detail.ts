"use client";

import { useState, useEffect, useCallback } from "react";
import { getStudent, getStudentAssessments, getMetricConfigs } from "@/lib/storage";
import { Student, Assessment } from "@/lib/types";
import { resolveMetricConfigs } from "@/domain/trainer/services/MetricConfigResolver";

type ResolvedMetrics = ReturnType<typeof resolveMetricConfigs>;

interface UseStudentDetailResult {
  student: Student | null;
  assessments: Assessment[];
  resolvedMetrics: ResolvedMetrics;
  loading: boolean;
  notFound: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useStudentDetail(studentId: string): UseStudentDetailResult {
  const [student, setStudent] = useState<Student | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [resolvedMetrics, setResolvedMetrics] = useState<ResolvedMetrics>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const [s, ass, configs] = await Promise.all([
        getStudent(studentId),
        getStudentAssessments(studentId),
        getMetricConfigs(),
      ]);

      if (!s) {
        setNotFound(true);
        setStudent(null);
        return;
      }

      setStudent(s);
      setAssessments(ass);
      setResolvedMetrics(resolveMetricConfigs(configs));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao carregar dados do aluno";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { student, assessments, resolvedMetrics, loading, notFound, error, refresh };
}
