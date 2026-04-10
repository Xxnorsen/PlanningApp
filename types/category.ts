export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  taskCount?: number;
  createdAt: string;
}

export interface CreateCategoryPayload {
  name: string;
  color: string;
  icon?: string;
}
