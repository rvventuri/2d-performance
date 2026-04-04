import { Student } from "@/lib/types";
import { IStudentRepository } from "@/domain/student/repositories/IStudentRepository";
import type { StudentRow } from "@/lib/supabase/database.types";

function rowToStudent(row: StudentRow): Student {
  return {
    id: row.id,
    name: row.name,
    age: row.age ?? 0,
    weight: row.weight ?? 0,
    height: row.height ?? 0,
    objective: row.objective ?? "",
    photoUrl: row.photo_url ?? null,
    createdAt: row.created_at,
  };
}

export class SupabaseStudentRepository implements IStudentRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly supabase: any, private readonly userId: string) {}

  async getAll(): Promise<Student[]> {
    const { data, error } = await this.supabase
      .from("students")
      .select("*")
      .eq("user_id", this.userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return ((data ?? []) as StudentRow[]).map(rowToStudent);
  }

  async getById(id: string): Promise<Student | null> {
    const { data, error } = await this.supabase
      .from("students")
      .select("*")
      .eq("id", id)
      .eq("user_id", this.userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }
    return rowToStudent(data as StudentRow);
  }

  async create(input: Omit<Student, "id" | "createdAt">): Promise<Student> {
    const { data, error } = await this.supabase
      .from("students")
      .insert({
        user_id: this.userId,
        name: input.name,
        age: input.age || null,
        weight: input.weight || null,
        height: input.height || null,
        objective: input.objective || null,
        photo_url: input.photoUrl ?? null,
        is_demo: false,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return rowToStudent(data as StudentRow);
  }

  async update(id: string, input: Partial<Omit<Student, "id" | "createdAt">>): Promise<Student | null> {
    const { data, error } = await this.supabase
      .from("students")
      .update({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.age !== undefined && { age: input.age || null }),
        ...(input.weight !== undefined && { weight: input.weight || null }),
        ...(input.height !== undefined && { height: input.height || null }),
        ...(input.objective !== undefined && { objective: input.objective || null }),
        ...("photoUrl" in input && { photo_url: input.photoUrl ?? null }),
      })
      .eq("id", id)
      .eq("user_id", this.userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return rowToStudent(data as StudentRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("students")
      .delete()
      .eq("id", id)
      .eq("user_id", this.userId);

    if (error) throw new Error(error.message);
  }
}

