'use client';

import React from 'react';
import { 
  SlidersHorizontal, 
  Filter, 
  Check, 
  ChevronRight,
  CircleDot,
  Signal,
  Users,
  Calendar,
  Layers,
  Tag,
  UserCheck,
  RotateCcw
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Priority, TaskStatus } from '@/types/task.types';
import { PRIORITY_CONFIG } from '@/lib/constants';
import { PrioritySignalIcon } from './priority-badge';

export interface VisibleFields {
  priority: boolean;
  role: boolean;
  dueDate: boolean;
  labels: boolean;
}

export interface TaskFilters {
  priority: Priority | 'ALL';
  status: TaskStatus | 'ALL';
  role: string | 'ALL';
  dueDateRange: 'ALL' | 'OVERDUE' | 'TODAY' | 'THIS_WEEK';
  team: string | 'ALL';
  label: string | 'ALL';
  reporter: string | 'ALL';
}

const priorityOptions: { label: string; value: Priority }[] = [
  { label: 'No Priority', value: 'NO_PRIORITY' },
  { label: 'Urgent', value: 'URGENT' },
  { label: 'High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Low', value: 'LOW' },
];

const statusOptions: { label: string; value: TaskStatus | 'ALL' }[] = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'To Do', value: 'TODO' },
  { label: 'Doing', value: 'DOING' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'On Hold', value: 'ON_HOLD' },
];

const dueDateOptions: { label: string; value: TaskFilters['dueDateRange'] }[] = [
  { label: 'All Dates', value: 'ALL' },
  { label: 'Overdue', value: 'OVERDUE' },
  { label: 'Due Today', value: 'TODAY' },
  { label: 'Due This Week', value: 'THIS_WEEK' },
];

const defaultTeams = ['Product', 'Engineering', 'Design', 'Marketing'];
const defaultLabels = ['Research', 'Design', 'Development', 'Testing', 'Deployment'];
const defaultReporters = ['Dexter', 'Ankit', 'Admin'];

// 1. Export Fields Visibility Dropdown
export function FieldsDropdown({
  visibleFields,
  onVisibleFieldsChange,
}: {
  visibleFields: VisibleFields;
  onVisibleFieldsChange: (fields: VisibleFields) => void;
}) {
  const toggleField = (key: keyof VisibleFields) => {
    onVisibleFieldsChange({
      ...visibleFields,
      [key]: !visibleFields[key],
    });
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition outline-none shadow-sm">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Fields</span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1.5 z-50 text-xs space-y-0.5"
        >
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Toggle Fields
          </div>

          <button
            onClick={() => toggleField('priority')}
            className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition text-left"
          >
            <span>Priority</span>
            {visibleFields.priority && <Check className="w-3.5 h-3.5 text-primary" />}
          </button>

          <button
            onClick={() => toggleField('role')}
            className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition text-left"
          >
            <span>Role / Member</span>
            {visibleFields.role && <Check className="w-3.5 h-3.5 text-primary" />}
          </button>

          <button
            onClick={() => toggleField('dueDate')}
            className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition text-left"
          >
            <span>Due Date</span>
            {visibleFields.dueDate && <Check className="w-3.5 h-3.5 text-primary" />}
          </button>

          <button
            onClick={() => toggleField('labels')}
            className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition text-left"
          >
            <span>Labels</span>
            {visibleFields.labels && <Check className="w-3.5 h-3.5 text-primary" />}
          </button>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// 2. Export Filter Dropdown
export function FilterDropdown({
  filters,
  onFiltersChange,
  availableRoles,
}: {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  availableRoles: string[];
}) {
  const isFiltered = 
    filters.priority !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.role !== 'ALL' ||
    filters.dueDateRange !== 'ALL' ||
    filters.team !== 'ALL' ||
    filters.label !== 'ALL' ||
    filters.reporter !== 'ALL';

  const resetFilters = () => {
    onFiltersChange({
      priority: 'ALL',
      status: 'ALL',
      role: 'ALL',
      dueDateRange: 'ALL',
      team: 'ALL',
      label: 'ALL',
      reporter: 'ALL',
    });
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition outline-none shadow-sm ${
            isFiltered
              ? 'bg-primary/10 border-primary text-primary dark:bg-primary/20'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filter</span>
          {isFiltered && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="w-52 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1.5 z-50 text-xs space-y-0.5 animate-in fade-in-50"
        >
          {/* Status */}
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 outline-none cursor-pointer">
              <div className="flex items-center gap-2">
                <CircleDot className="w-3.5 h-3.5 text-zinc-500" />
                <span>Status</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.SubContent className="w-36 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1 z-50 text-xs space-y-0.5">
                {statusOptions.map((st) => (
                  <DropdownMenu.Item
                    key={st.value}
                    onClick={() => onFiltersChange({ ...filters, status: st.value })}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300"
                  >
                    <span>{st.label}</span>
                    {filters.status === st.value && <Check className="w-3.5 h-3.5 text-primary" />}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>

          {/* Priority */}
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 outline-none cursor-pointer">
              <div className="flex items-center gap-2">
                <Signal className="w-3.5 h-3.5 text-zinc-500" />
                <span>Priority</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.SubContent className="w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1.5 z-50 text-xs space-y-1">
                <div className="px-2 py-0.5 text-[10px] font-semibold text-zinc-400">Priority</div>
                {priorityOptions.map((opt) => (
                  <DropdownMenu.Item
                    key={opt.value}
                    onClick={() => onFiltersChange({ ...filters, priority: opt.value })}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <PrioritySignalIcon priority={opt.value} className="w-3.5 h-3.5" />
                      <span className={`text-[11px] font-medium ${PRIORITY_CONFIG[opt.value]?.text || 'text-zinc-700 dark:text-zinc-300'}`}>
                        {opt.label}
                      </span>
                    </div>
                    {filters.priority === opt.value && <Check className="w-3.5 h-3.5 text-zinc-800 dark:text-zinc-200" />}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>

          {/* Members */}
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 outline-none cursor-pointer">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-zinc-500" />
                <span>Members</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.SubContent className="w-36 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1 z-50 text-xs space-y-0.5">
                <DropdownMenu.Item
                  onClick={() => onFiltersChange({ ...filters, role: 'ALL' })}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300"
                >
                  <span>All Members</span>
                  {filters.role === 'ALL' && <Check className="w-3.5 h-3.5 text-primary" />}
                </DropdownMenu.Item>
                {availableRoles.map((role) => (
                  <DropdownMenu.Item
                    key={role}
                    onClick={() => onFiltersChange({ ...filters, role })}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300"
                  >
                    <span>{role}</span>
                    {filters.role === role && <Check className="w-3.5 h-3.5 text-primary" />}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>

          {/* Due Date */}
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 outline-none cursor-pointer">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>Due Date</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.SubContent className="w-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1 z-50 text-xs space-y-0.5">
                {dueDateOptions.map((opt) => (
                  <DropdownMenu.Item
                    key={opt.value}
                    onClick={() => onFiltersChange({ ...filters, dueDateRange: opt.value })}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300"
                  >
                    <span>{opt.label}</span>
                    {filters.dueDateRange === opt.value && <Check className="w-3.5 h-3.5 text-primary" />}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>

          {/* Teams */}
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 outline-none cursor-pointer">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-zinc-500" />
                <span>Teams</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.SubContent className="w-36 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1 z-50 text-xs space-y-0.5">
                <DropdownMenu.Item
                  onClick={() => onFiltersChange({ ...filters, team: 'ALL' })}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300"
                >
                  <span>All Teams</span>
                  {filters.team === 'ALL' && <Check className="w-3.5 h-3.5 text-primary" />}
                </DropdownMenu.Item>
                {defaultTeams.map((t) => (
                  <DropdownMenu.Item
                    key={t}
                    onClick={() => onFiltersChange({ ...filters, team: t })}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300"
                  >
                    <span>{t}</span>
                    {filters.team === t && <Check className="w-3.5 h-3.5 text-primary" />}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>

          {/* Labels */}
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 outline-none cursor-pointer">
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-zinc-500" />
                <span>Labels</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.SubContent className="w-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1 z-50 text-xs space-y-0.5">
                <DropdownMenu.Item
                  onClick={() => onFiltersChange({ ...filters, label: 'ALL' })}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300"
                >
                  <span>All Labels</span>
                  {filters.label === 'ALL' && <Check className="w-3.5 h-3.5 text-primary" />}
                </DropdownMenu.Item>
                {defaultLabels.map((l) => (
                  <DropdownMenu.Item
                    key={l}
                    onClick={() => onFiltersChange({ ...filters, label: l })}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300"
                  >
                    <span>{l}</span>
                    {filters.label === l && <Check className="w-3.5 h-3.5 text-primary" />}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>

          {/* Reporter */}
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 outline-none cursor-pointer">
              <div className="flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-zinc-500" />
                <span>Reporter</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.SubContent className="w-36 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1 z-50 text-xs space-y-0.5">
                <DropdownMenu.Item
                  onClick={() => onFiltersChange({ ...filters, reporter: 'ALL' })}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300"
                >
                  <span>All Reporters</span>
                  {filters.reporter === 'ALL' && <Check className="w-3.5 h-3.5 text-primary" />}
                </DropdownMenu.Item>
                {defaultReporters.map((rep) => (
                  <DropdownMenu.Item
                    key={rep}
                    onClick={() => onFiltersChange({ ...filters, reporter: rep })}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300"
                  >
                    <span>{rep}</span>
                    {filters.reporter === rep && <Check className="w-3.5 h-3.5 text-primary" />}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>

          {/* Reset Filters */}
          {isFiltered && (
            <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={resetFilters}
                className="flex items-center justify-center gap-1.5 w-full py-1.5 text-[11px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md font-medium text-center transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            </div>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}