import { ColorAccent } from '../types/theme.types';
import { Priority, TaskStatus } from '../types/task.types';

export const COLOR_ACCENTS: { name: string; value: ColorAccent; bgClass: string }[] = [
  { name: 'Amber', value: 'amber', bgClass: 'bg-amber-500' },
  { name: 'Blue', value: 'blue', bgClass: 'bg-indigo-600' },
  { name: 'Pink', value: 'pink', bgClass: 'bg-pink-500' },
  { name: 'Rose', value: 'rose', bgClass: 'bg-rose-500' },
  { name: 'Emerald', value: 'emerald', bgClass: 'bg-emerald-500' },
  { name: 'Black', value: 'black', bgClass: 'bg-zinc-900' },
];

export const TASK_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'TODO', label: 'To Do' },
  { status: 'DOING', label: 'Doing' },
  { status: 'COMPLETED', label: 'Completed' },
  { status: 'ON_HOLD', label: 'On Hold' },
];

export const PRIORITY_CONFIG: Record<Priority, { text: string; bg: string; dot: string }> = {
  URGENT: { text: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/40', dot: 'bg-red-500' },
  HIGH: { text: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/40', dot: 'bg-orange-500' },
  MEDIUM: { text: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40', dot: 'bg-amber-500' },
  LOW: { text: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40', dot: 'bg-emerald-500' },
  NO_PRIORITY: { text: 'text-zinc-500', bg: 'bg-zinc-100 dark:bg-zinc-800', dot: 'bg-zinc-400' },
};
