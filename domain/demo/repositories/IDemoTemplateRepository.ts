/**
 * Clonagem de dados de demonstração a partir de um usuário template (service role).
 */
export interface IDemoTemplateRepository {
  hasDemoBeenApplied(userId: string): Promise<boolean>;
  cloneTemplateToUser(targetUserId: string, templateUserId: string): Promise<void>;
  clearDemoStudents(userId: string): Promise<number>;
  markDemoCleared(userId: string): Promise<void>;
}
