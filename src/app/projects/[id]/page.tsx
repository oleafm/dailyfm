'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Project, Task, TimeEntry } from '@/types';
import { formatHours } from '@/lib/utils';
import { format } from 'date-fns';

interface TimeEntryWithTask extends TimeEntry {
  task?: Task;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [entries, setEntries] = useState<TimeEntryWithTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskName, setNewTaskName] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [taskError, setTaskError] = useState('');

  const fetchData = useCallback(async () => {
    const [projectRes, tasksRes, entriesRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('tasks').select('*').eq('project_id', projectId).order('created_at', { ascending: true }),
      supabase
        .from('time_entries')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_running', false)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (projectRes.error || !projectRes.data) {
      router.push('/projects');
      return;
    }

    setProject(projectRes.data);
    const fetchedTasks = tasksRes.data || [];
    setTasks(fetchedTasks);

    const rawEntries: TimeEntry[] = entriesRes.data || [];
    const enrichedEntries: TimeEntryWithTask[] = rawEntries.map((entry) => ({
      ...entry,
      task: fetchedTasks.find((t) => t.id === entry.task_id),
    }));
    setEntries(enrichedEntries);
    setLoading(false);
  }, [projectId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) {
      setTaskError('Task name is required');
      return;
    }
    setSavingTask(true);
    setTaskError('');
    const { error: err } = await supabase.from('tasks').insert({
      project_id: projectId,
      name: newTaskName.trim(),
    });
    setSavingTask(false);
    if (err) {
      setTaskError(err.message);
    } else {
      setNewTaskName('');
      setShowTaskForm(false);
      await fetchData();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    await supabase.from('tasks').delete().eq('id', taskId);
    await fetchData();
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Delete this time entry?')) return;
    await supabase.from('time_entries').delete().eq('id', entryId);
    await fetchData();
  };

  const totalHours = entries.reduce((sum, e) => sum + (e.hours || 0), 0);

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <div className="bg-gray-900 rounded-xl h-16 animate-pulse" />
        <div className="bg-gray-900 rounded-xl h-40 animate-pulse" />
        <div className="bg-gray-900 rounded-xl h-60 animate-pulse" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/projects')}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-100 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Projects
        </button>
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full shrink-0"
            style={{ backgroundColor: project.color }}
          />
          <div>
            <h1 className="text-xl font-bold text-gray-100">{project.name}</h1>
            {project.client && (
              <p className="text-sm text-gray-400">{project.client}</p>
            )}
          </div>
          <div className="ml-auto text-right">
            <div className="text-xl font-bold text-amber-500">{formatHours(totalHours)}</div>
            <div className="text-xs text-gray-500">total logged</div>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Tasks</h2>
          <button
            onClick={() => { setShowTaskForm(!showTaskForm); setTaskError(''); }}
            className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400 transition-colors font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </button>
        </div>

        {showTaskForm && (
          <form onSubmit={handleAddTask} className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-3 space-y-3">
            {taskError && (
              <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{taskError}</p>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="Task name"
                autoFocus
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={savingTask}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-gray-950 font-semibold rounded-lg px-4 py-2 text-sm transition-colors min-h-[44px]"
              >
                {savingTask ? '...' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => { setShowTaskForm(false); setNewTaskName(''); setTaskError(''); }}
                className="px-3 py-2 text-sm text-gray-400 hover:text-gray-100 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {tasks.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-600">
            <p className="text-sm">No tasks yet. Add tasks to organize your time entries.</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between px-4 py-3 group">
                <span className="text-sm text-gray-200">{task.name}</span>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-gray-700 hover:text-red-400 transition-colors p-1 rounded opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Time Entries */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Recent Time Entries
          {entries.length > 0 && <span className="ml-2 text-gray-600 normal-case">({entries.length})</span>}
        </h2>

        {entries.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-600">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No time logged for this project yet.</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-start justify-between px-4 py-3 group gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-400">
                      {format(new Date(entry.date + 'T12:00:00'), 'MMM d, yyyy')}
                    </span>
                    {entry.task && (
                      <span className="text-xs text-gray-500 truncate">· {entry.task.name}</span>
                    )}
                  </div>
                  {entry.notes && (
                    <p className="text-sm text-gray-300 mt-0.5 truncate">{entry.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold text-amber-500">
                    {formatHours(entry.hours || 0)}
                  </span>
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="text-gray-700 hover:text-red-400 transition-colors p-1 rounded opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
