/**
 * Clonagem de dados de demonstração a partir de um usuário seed (service role).
 * A escolha de modalidade e `user_demo_state` são gravadas pelo app com o cliente do usuário (RLS).
 */
export interface IDemoTemplateRepository {
  cloneDemoFromTemplateUser(targetUserId: string, templateUserId: string): Promise<void>;
  clearDemoStudents(userId: string): Promise<number>;
  markDemoCleared(userId: string): Promise<void>;
}
