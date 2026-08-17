export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  SECRETARY: 'secretary',
  TREASURER: 'treasurer',
  IMAM: 'imam',
  MADRASA_PRINCIPAL: 'madrasa_principal',
  USTADH: 'ustadh',
  PARENT: 'parent',
  STUDENT: 'student',
  SADAR_MUALIM: 'sadar_mualim',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
