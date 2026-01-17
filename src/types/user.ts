// User & Auth Types
export type Permission = 'VIEW_DASHBOARD' | 'CREATE_REQUEST' | 'MANAGE_CONFIG' | 'VIEW_RESULTS';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  permissions: Permission[];
}
