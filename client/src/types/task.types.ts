export type Priority = 'NO_PRIORITY' | 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'TODO' | 'DOING' | 'COMPLETED' | 'ON_HOLD';

export interface TaskResource {
  id?: string;
  name: string;
  url: string;
}

export interface Subtask {
  id: string;
  title: string;
  priority: Priority;
  dueDate?: string;
  completed: boolean;
  taskId?: string;
  assignee?: string;
  assigneeInitials?: string;
}

export interface TaskComment {
  id: string;
  content: string;
  author: string;
  authorAvatar?: string;
  type?: string;
  taskId?: string;
  createdAt: string;
}

export interface TaskUpdate {
  id: string;
  action: string;
  author: string;
  taskId?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  labels: string[];
  role?: string;
  team?: string;
  reporter?: string;
  isLocked?: boolean;
  isPublic?: boolean;
  projectId?: string;
  project?: {
    id: string;
    title: string;
    priority?: Priority;
  };
  assignees?: any[];
  subtasks?: Subtask[];
  comments?: TaskComment[];
  updates?: TaskUpdate[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string;
  labels?: string[];
  role?: string;
  team?: string;
  projectId?: string;
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> {}
