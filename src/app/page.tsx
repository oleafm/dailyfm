'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Square, Plus, Clock, Trash2, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Project, Task, TimeEntry, TimeEntryWithRelations } from '@/types';
import { formatHours, formatDuration, todayString } from '@/lib/utils';
import TimeEntryForm from '@/components/TimeEntryForm';

export default function TodayPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<TimeEntryWithRelations[]>([]);
  const [runningEntry, setRunningEntry] = useState<TimeEntryWithRelations | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showManualForm, setShowManualForm] = useState(false);
  const [startProjectId, setStartProjectId] = useState('');
  const [startTaskId, setStartTaskId] = useState('');
  const [startTasks, setStartTasks] = useState<Task[]>([]);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const today = todayString();

    const [projectsRes, entriesRes, runningRes] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('time_entries').select('*').eq('date', today).eq('is_running', false).order('created_at', { ascending: false }),
      supabase.from('time_entries').select('*').eq('is_running', true).limit(1),
    ]);

    const allProjects: Project[] = projectsRes.data || [];
    const allTasks: Task[] = [];

    if (allProjects.length > 0) {
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .in('project_id', allProjects.map((p) => p.id));
      allTasks.push(...(tasksData || []));
    }

    setProjects(allProjects);

    const enrichEntry = (entry: TimeEntry): TimeEntryWithRelations => ({
      ...entry,
      project: allProjects.find((p) => p.id === entry.project_id),
      task: allTasks.find((t) => t.id === entry.task_id),
    });

    setEntries((entriesRes.data || []).map(enrichEntry));

    const running = runningRes.data?.[0];
    if (running) {
      const enriched = enrichEntry(running);
      setRunningEntry(enriched);
      const secs = Math.floor((Date.now() - new Date(running.started_at!).getTime()) / 1000);
      setElapsed(secs);
    } else {
      setRunningEntry(null);
      setElapsed(0);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (runningEntry) {
      intervalRef.current = setInterval(() => {
        setElapsed((s) => s + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [runningEntry]);

  useEffect(() => {
    if (startProjectId) {
      supabase
        .from('tasks')
        .select('*')
        .eq('project_id', startProjectId)
        .order('created_at', { ascending: true })
        .then(({ data }) => setStartTasks(data || []));
    } else {
      setStartTasks([]);
      setStartTaskId('');
    }
  }, [startProjectId]);

  const handleStart = async () => {
    if (!startProjectId) {
      setError('Please select a project');
      return;
    }
    setStarting(true);
    setError('');

    // Stop any running entry first
    if (runningEntry) {
      const hoursElapsed = elapsed / 3600;
      await supabase.from('time_entries').update({
        is_running: false,
        stopped_at: new Date().toISOString(),
        hours: Math.round(hoursElapsed * 100) / 100,
      }).eq('id', runningEntry.id);
    }

    const now = new Date().toISOString();
    const { error: err } = await supabase.from('time_entries').insert({
      project_id: startProjectId,
      task_id: startTaskId || null,
      date: todayString(),
      is_running: true,
      started_at: now,
    });

    setStarting(false);
    if (err) {
      setError(err.message);
    } else {
      await fetchData();
    }
  };

  const handleStop = async () => {
    if (!runningEntry) return;
    const hoursElapsed = elapsed / 3600;
    const { error: err } = await supabase.from('time_entries').update({
      is_running: false,
      stopped_at: new Date().toISOString(),
      hours: Math.round(hoursElapsed * 100) / 100,
    }).eq('id', runningEntry.id);

    if (err) {
      setError(err.message);
    } else {
      await fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this time entry?')) return;
    await supabase.from('time_entries').delete().eq('id', id);
    await fetchData();
  };

  const totalHoursToday = entries.reduce((sum, e) => sum + (e.hours || 0), 0);

  if (!isSupabaseConfigured) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 flex gap-4">
          <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold text-amber-400 mb-2">Supabase Not Configured</h2>
            <p className="text-gray-300 text-sm mb-3">
              To use TimerFM, you need to configure your Supabase credentials.
            </p>
            <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
              <li>Copy <code className="text-amber-400">.env.local.example</code> to <code className="text-amber-400">.env.local</code></li>
              <li>Add your Supabase project URL and anon key</li>
              <li>Run the SQL in <code className="text-amber-400">supabase/schema.sql</code> in your Supabase SQL editor</li>
              <li>Restart the dev server</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-900 rounded-xl h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-100">Today</h1>
        <div className="text-right">
          <div className="text-2xl font-bold text-amber-500">{formatHours(totalHoursToday)}</div>
          <div className="text-xs text-gray-500">total today</div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Timer Section */}
      {runningEntry ? (
        <div className="bg-gray-900 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: runningEntry.project?.color || '#f59e0b' }}
              />
              <div>
                <div className="font-semibold text-gray-100">{runningEntry.project?.name || 'Unknown Project'}</div>
                {runningEntry.task && (
                  <div className="text-sm text-gray-400">{runningEntry.task.name}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="font-mono text-2xl font-bold text-amber-500">
                {formatDuration(elapsed)}
              </div>
              <button
                onClick={handleStop}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors min-h-[44px]"
              >
                <Square className="w-4 h-4 fill-current" />
                Stop
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
            <Clock className="w-4 h-4 text-amber-500" />
            Start Timer
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={startProjectId}
              onChange={(e) => { setStartProjectId(e.target.value); setStartTaskId(''); }}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-amber-500"
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              value={startTaskId}
              onChange={(e) => setStartTaskId(e.target.value)}
              disabled={!startProjectId || startTasks.length === 0}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-amber-500 disabled:opacity-50"
            >
              <option value="">No task</option>
              {startTasks.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleStart}
            disabled={starting}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors min-h-[44px]"
          >
            <Play className="w-4 h-4 fill-current" />
            {starting ? 'Starting...' : 'Start Timer'}
          </button>
        </div>
      )}

      {/* Manual Log Button / Form */}
      {!showManualForm ? (
        <button
          onClick={() => setShowManualForm(true)}
          className="w-full flex items-center justify-center gap-2 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-100 rounded-xl px-4 py-3 text-sm font-medium transition-colors min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          Log Time Manually
        </button>
      ) : (
        <TimeEntryForm
          projects={projects}
          onSuccess={() => { setShowManualForm(false); fetchData(); }}
          onCancel={() => setShowManualForm(false)}
        />
      )}

      {/* Today's Entries */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
          {entries.length > 0 ? `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}` : 'No entries yet'}
        </h2>
        {entries.length === 0 ? (
          <div className="text-center py-10 text-gray-600">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No time logged today. Start a timer or log time manually.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div key={entry.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start gap-3">
                <div
                  className="w-3 h-3 rounded-full mt-1 shrink-0"
                  style={{ backgroundColor: entry.project?.color || '#6b7280' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium text-gray-100 truncate">
                      {entry.project?.name || 'Unknown Project'}
                    </span>
                    <span className="text-amber-500 font-semibold shrink-0">
                      {formatHours(entry.hours || 0)}
                    </span>
                  </div>
                  {entry.task && (
                    <div className="text-sm text-gray-400">{entry.task.name}</div>
                  )}
                  {entry.notes && (
                    <div className="text-sm text-gray-500 mt-1 truncate">{entry.notes}</div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-gray-600 hover:text-red-400 transition-colors p-1 rounded min-w-[32px] min-h-[32px] flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
