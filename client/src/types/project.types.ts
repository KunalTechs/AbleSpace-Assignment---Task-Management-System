import { Priority, Task, TaskStatus } from './task.types';

export interface Project {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status?: TaskStatus;
  leadName?: string;
  leadAvatar?: string;
  team?: string;
  dueDate?: string;
  tasks?: Task[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProjectDto {
  title: string;
  description?: string;
  priority?: Priority;
  status?: TaskStatus;
  leadName?: string;
  team?: string;
  dueDate?: string;
}

export interface UpdateProjectDto extends Partial<CreateProjectDto> {}