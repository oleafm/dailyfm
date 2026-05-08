'use client';

import { useState, useEffect } from 'react';
import { Project, Task } from '@/types';
import { supabase } from '@/lib/supabase';
import { todayString } from '@/lib/utils';

interface TimeEntryFormProps {
  projects: Project[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TimeEntryForm({ projects, onSuccess, onCancel }: TimeEntryFormProps) {
  const [date, setDate] = useState(todayString());
  const [hours, setHours] = useState('');
  const [projectId, setProjectId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [notes, setNotes] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (projectId) {
      supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })
        .then(({ data }) => setTasks(data || []));
    } else {
      setTasks([]);
      setTaskId('');
    }
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      setError('Please select a project');
      return;
    }
    if (!hours || isNaN(Number(hours)) || Number(hours) <= 0) {
      setError('Please enter valid hours');
      return;
    }
    setSaving(true);
    setError('');
    const { error: err } = await supabase.from('time_entries').insert({
      project_id: projectId,
      task_id: taskId || null,
      date,
      hours: Number(hours),
      notes: notes || null,
      is_running: false,
    });
    setSaving(false);
    if (err) {
      setError(err.message);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-200">Log Time Manually</h3>
      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Hours</label>
          <input
            type="number"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="1.5"
            min="0.25"
            step="0.25"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Project</label>
        <select
          value={projectId}
          onChange={(e) => { setProjectId(e.target.value); setTaskId(''); }}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-amber-500"
        >
          <option value="">Select a project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      {tasks.length > 0 && (
        <div>
          <label className="block text-xs text-gray-400 mb-1">Task (optional)</label>
          <select
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-amber-500"
          >
            <option value="">No specific task</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What did you work on?"
          rows={2}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-amber-500 resize-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-gray-950 font-semibold rounded-lg px-4 py-2 text-sm transition-colors"
        >
          {saving ? 'Saving...' : 'Save Entry'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-400 hover:text-gray-100 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
