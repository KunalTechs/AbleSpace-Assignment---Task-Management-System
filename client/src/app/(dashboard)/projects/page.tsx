'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  SlidersHorizontal, 
  Search, 
  MoreHorizontal, 
  Check, 
  Filter, 
  ChevronRight, 
  CircleDot, 
  Signal, 
  Users, 
  Calendar, 
  Layers, 
  Tag, 
  UserCheck, 
  RotateCcw,
  Trash2,
  FolderOpen
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { api } from '@/lib/api-client';
import { Project } from '@/types/project.types';
import { Priority, TaskStatus } from '@/types/task.types';
import { useDebounce } from '@/hooks/use-debounce';
import { cn, formatDate } from '@/lib/utils';
import { PRIORITY_CONFIG } from '@/lib/constants';
import { PrioritySignalIcon } from '@/components/tasks/priority-badge';

interface ProjectVisibleFields {
  priority: boolean;
  lead: boolean;
  dueDate: boolean;
}

interface ProjectFilters {
  priority: Priority | 'ALL';
  lead: string | 'ALL';
  dueDateRange: 'ALL' | 'OVERDUE' | 'TODAY' | 'THIS_WEEK';
  team: string | 'ALL';
  status: TaskStatus | 'ALL';
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

const dueDateOptions: { label: string; value: ProjectFilters['dueDateRange'] }[] = [
  { label: 'All Dates', value: 'ALL' },
  { label: 'Overdue', value: 'OVERDUE' },
  { label: 'Due Today', value: 'TODAY' },
  { label: 'Due This Week', value: 'THIS_WEEK' },
];

const defaultTeams = ['Product', 'Engineering', 'Design', 'Marketing'];
const defaultLabels = ['Research', 'Design', 'Development', 'Testing', 'Deployment'];
const defaultReporters = ['Dexter', 'Ankit', 'Admin'];

export default function ProjectsPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Column visibility state
  const [visibleFields, setVisibleFields] = useState<ProjectVisibleFields>({
    priority: true,
    lead: true,
    dueDate: true,
  });

  // Filter criteria matching Figma dropdown
  const [filters, setFilters] = useState<ProjectFilters>({
    priority: 'ALL',
    lead: 'ALL',
    dueDateRange: 'ALL',
    team: 'ALL',
    status: 'ALL',
    label: 'ALL',
    reporter: 'ALL',
  });

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await api.post('/projects', {
        title: newTitle,
        priority: 'MEDIUM',
        leadName: 'Dexter',
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      });
      setProjects((prev) => [res.data, ...prev]);
      setNewTitle('');
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to create project', err);
    }
  };

  const handleDeleteProject = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete project "${title}"?`)) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const toggleField = (key: keyof ProjectVisibleFields) => {
    setVisibleFields((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Derive unique leads dynamically
  const availableLeads = useMemo(() => {
    const leads = new Set<string>();
    projects.forEach((p) => {
      if (p.leadName) leads.add(p.leadName);
    });
    return Array.from(leads);
  }, [projects]);

  const isFiltered =
    filters.priority !== 'ALL' ||
    filters.lead !== 'ALL' ||
    filters.dueDateRange !== 'ALL' ||
    filters.team !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.label !== 'ALL' ||
    filters.reporter !== 'ALL';

  const resetFilters = () => {
    setFilters({
      priority: 'ALL',
      lead: 'ALL',
      dueDateRange: 'ALL',
      team: 'ALL',
      status: 'ALL',
      label: 'ALL',
      reporter: 'ALL',
    });
  };

  // Filter projects by Search query and Filter selections
  const filteredProjects = useMemo(() => {
    return projects.filter((proj) => {
      // 1. Search Query
      if (debouncedSearch.trim()) {
        const query = debouncedSearch.toLowerCase();
        const matchTitle = proj.title.toLowerCase().includes(query);
        const matchLead = proj.leadName?.toLowerCase().includes(query);
        if (!matchTitle && !matchLead) return false;
      }

      // 2. Priority Filter
      if (filters.priority !== 'ALL' && proj.priority !== filters.priority) return false;

      // 3. Lead / Member Filter
      if (filters.lead !== 'ALL' && proj.leadName !== filters.lead) return false;

      // 4. Due Date Range Filter
      if (filters.dueDateRange !== 'ALL') {
        if (!proj.dueDate) return false;
        const due = new Date(proj.dueDate).getTime();
        const startOfDay = new Date().setHours(0, 0, 0, 0);
        const endOfDay = new Date().setHours(23, 59, 59, 999);
        const oneWeekOut = Date.now() + 7 * 86400000;

        if (filters.dueDateRange === 'OVERDUE' && due >= startOfDay) return false;
        if (filters.dueDateRange === 'TODAY' && (due < startOfDay || due > endOfDay)) return false;
        if (filters.dueDateRange === 'THIS_WEEK' && (due < startOfDay || due > oneWeekOut)) return false;
      }

      return true;
    });
  }, [projects, debouncedSearch, filters]);

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Projects</h1>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="pl-9 pr-12 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:ring-2 focus:ring-primary w-52 text-zinc-800 dark:text-zinc-200"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
              ⌘F
            </span>
          </div>

          {/* Fields Toggle Dropdown */}
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
                className="w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1.5 z-50 text-xs space-y-0.5 animate-in fade-in-50"
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
                  onClick={() => toggleField('lead')}
                  className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition text-left"
                >
                  <span>Lead</span>
                  {visibleFields.lead && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>

                <button
                  onClick={() => toggleField('dueDate')}
                  className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition text-left"
                >
                  <span>Due Date</span>
                  {visibleFields.dueDate && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/* Filter Dropdown (Figma Cascading Submenu) */}
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
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-default">
                  <div className="flex items-center gap-2">
                    <CircleDot className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Status</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                </div>

                {/* Priority Flyout */}
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
                      <DropdownMenu.Item
                        onClick={() => setFilters({ ...filters, priority: 'ALL' })}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300"
                      >
                        <span>All Priorities</span>
                        {filters.priority === 'ALL' && <Check className="w-3.5 h-3.5 text-primary" />}
                      </DropdownMenu.Item>
                      {priorityOptions.map((opt) => (
                        <DropdownMenu.Item
                          key={opt.value}
                          onClick={() => setFilters({ ...filters, priority: opt.value })}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none"
                        >
                          <div className="flex items-center gap-2">
                            <PrioritySignalIcon priority={opt.value} className="w-3.5 h-3.5" />
                            <span className={`text-[11px] font-medium ${PRIORITY_CONFIG[opt.value]?.text || 'text-zinc-700 dark:text-zinc-300'}`}>
                              {opt.label}
                            </span>
                          </div>
                          {filters.priority === opt.value && <Check className="w-3.5 h-3.5 text-primary" />}
                        </DropdownMenu.Item>
                      ))}
                    </DropdownMenu.SubContent>
                  </DropdownMenu.Portal>
                </DropdownMenu.Sub>

                {/* Members / Leads Flyout */}
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
                        onClick={() => setFilters({ ...filters, lead: 'ALL' })}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300"
                      >
                        <span>All Members</span>
                        {filters.lead === 'ALL' && <Check className="w-3.5 h-3.5 text-primary" />}
                      </DropdownMenu.Item>
                      {availableLeads.map((ld) => (
                        <DropdownMenu.Item
                          key={ld}
                          onClick={() => setFilters({ ...filters, lead: ld })}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300"
                        >
                          <span>{ld}</span>
                          {filters.lead === ld && <Check className="w-3.5 h-3.5 text-primary" />}
                        </DropdownMenu.Item>
                      ))}
                    </DropdownMenu.SubContent>
                  </DropdownMenu.Portal>
                </DropdownMenu.Sub>

                {/* Due Date Flyout */}
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
                          onClick={() => setFilters({ ...filters, dueDateRange: opt.value })}
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
                        onClick={() => setFilters({ ...filters, team: 'ALL' })}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300"
                      >
                        <span>All Teams</span>
                        {filters.team === 'ALL' && <Check className="w-3.5 h-3.5 text-primary" />}
                      </DropdownMenu.Item>
                      {defaultTeams.map((t) => (
                        <DropdownMenu.Item
                          key={t}
                          onClick={() => setFilters({ ...filters, team: t })}
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
                        onClick={() => setFilters({ ...filters, label: 'ALL' })}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300"
                      >
                        <span>All Labels</span>
                        {filters.label === 'ALL' && <Check className="w-3.5 h-3.5 text-primary" />}
                      </DropdownMenu.Item>
                      {defaultLabels.map((l) => (
                        <DropdownMenu.Item
                          key={l}
                          onClick={() => setFilters({ ...filters, label: l })}
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
                        onClick={() => setFilters({ ...filters, reporter: 'ALL' })}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300"
                      >
                        <span>All Reporters</span>
                        {filters.reporter === 'ALL' && <Check className="w-3.5 h-3.5 text-primary" />}
                      </DropdownMenu.Item>
                      {defaultReporters.map((rep) => (
                        <DropdownMenu.Item
                          key={rep}
                          onClick={() => setFilters({ ...filters, reporter: rep })}
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

          {/* Add Project Button */}
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:opacity-90 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Project
          </button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="mt-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-medium bg-zinc-50/50 dark:bg-zinc-800/30">
              <th className="py-3 px-4 font-normal">Projects</th>
              {visibleFields.priority && <th className="py-3 px-4 font-normal">Priority</th>}
              {visibleFields.lead && <th className="py-3 px-4 font-normal">Lead</th>}
              {visibleFields.dueDate && <th className="py-3 px-4 font-normal">Due Date</th>}
              <th className="py-3 px-4 font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-zinc-400">Loading projects...</td>
              </tr>
            ) : filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-zinc-400 space-y-2">
                  <p>{search || isFiltered ? 'No projects match your filter criteria.' : 'No projects found.'}</p>
                  {isFiltered && (
                    <button
                      onClick={resetFilters}
                      className="text-xs text-primary font-medium hover:underline"
                    >
                      Clear all filters
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredProjects.map((proj) => (
                <tr
                  key={proj.id}
                  onClick={() => router.push(`/projects/${proj.id}`)}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer transition"
                >
                  <td className="py-3.5 px-4 font-medium text-zinc-800 dark:text-zinc-200">
                    {proj.title}
                  </td>
                  {visibleFields.priority && (
                    <td className="py-3.5 px-4">
                      <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium', PRIORITY_CONFIG[proj.priority]?.bg, PRIORITY_CONFIG[proj.priority]?.text)}>
                        <PrioritySignalIcon priority={proj.priority} className="w-3 h-3" />
                        {proj.priority.replace('_', ' ')}
                      </span>
                    </td>
                  )}
                  {visibleFields.lead && (
                    <td className="py-3.5 px-4">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                        {proj.leadName?.[0] || 'D'}
                      </div>
                    </td>
                  )}
                  {visibleFields.dueDate && (
                    <td className="py-3.5 px-4 text-zinc-500">
                      {formatDate(proj.dueDate)}
                    </td>
                  )}
                  <td className="py-3.5 px-4 text-right">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded transition outline-none"
                        >
                          <MoreHorizontal className="w-4 h-4 inline" />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          align="end"
                          className="w-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1 z-50 text-xs space-y-0.5"
                        >
                          <DropdownMenu.Item
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/projects/${proj.id}`);
                            }}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300"
                          >
                            <FolderOpen className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Open Project</span>
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            onClick={(e) => handleDeleteProject(proj.id, proj.title, e as any)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer outline-none text-red-600 dark:text-red-400 font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Project</span>
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </td>
                </tr>
              ))
            )}

            {isAdding && (
              <tr>
                <td colSpan={5} className="p-3 bg-zinc-50/50 dark:bg-zinc-800/30">
                  <form onSubmit={handleCreateProject} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Enter project title..."
                      autoFocus
                      className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-primary text-zinc-800 dark:text-zinc-200"
                    />
                    <button type="submit" className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg font-medium">
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                  </form>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
