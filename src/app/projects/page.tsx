'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FolderOpen, Plus, Trash2, ChevronRight, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Project } from '@/types';
import { formatHours } from '@/lib/utils';
import ProjectColorPicker from '@/components/ProjectColorPicker';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectHours, setProjectHours] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#f59e0b');
  const [client, setClient] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchProjects = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const { data: projectsData } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    const projects = projectsData || [];
    setProjects(projects);

    if (projects.length > 0) {
      const { data: entriesData } = await supabase
        .from('time_entries')
        .select('project_id, hours')
        .in('project_id', projects.map((p) => p.id))
        .eq('is_running', false);

      const hours: Record<string, number> = {};
      for (const entry of entriesData || []) {
        if (entry.project_id && entry.hours) {
          hours[entry.project_id] = (hours[entry.project_id] || 0) + entry.hours;
        }
      }
      setProjectHours(hours);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    setSaving(true);
    setError('');
    const { error: err } = await supabase.from('projects').insert({
      name: name.trim(),
      color,
      client: client.trim() || null,
    });
    setSaving(false);
    if (err) {
      setError(err.message);
    } else {
      setName('');
      setColor('#f59e0b');
      setClient('');
      setShowForm(false);
      await fetchProjects();
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this project and all its data?')) return;
    await supabase.from('projects').delete().eq('id', id);
    await fetchProjects();
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 flex gap-4">
          <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold text-amber-400 mb-2">Supabase Not Configured</h2>
            <p className="text-gray-300 text-sm">
              Configure your Supabase credentials in <code className="text-amber-400">.env.local</code> to use TimerFM.
            </p>
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
        <h1 className="text-xl font-bold text-gray-100">Projects</h1>
        <button
          onClick={() => { setShowForm(!showForm); setError(''); }}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-gray-950 font-semibold rounded-lg px-4 py-2 text-sm transition-colors min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-200">New Project</h3>
          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>
          )}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Project Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Project"
              autoFocus
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2">Color</label>
            <ProjectColorPicker value={color} onChange={setColor} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Client (optional)</label>
            <input
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Client name"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-gray-950 font-semibold rounded-lg px-4 py-2 text-sm transition-colors"
            >
              {saving ? 'Saving...' : 'Create Project'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(''); setName(''); setClient(''); setColor('#f59e0b'); }}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-100 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm font-medium text-gray-500">No projects yet</p>
          <p className="text-xs text-gray-600 mt-1">Create your first project to start tracking time</p>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => router.push(`/projects/${project.id}`)}
              className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 flex items-center gap-4 cursor-pointer group transition-colors"
              style={{ borderLeftColor: project.color, borderLeftWidth: '4px' }}
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-100 truncate">{project.name}</div>
                {project.client && (
                  <div className="text-sm text-gray-400 truncate">{project.client}</div>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="text-amber-500 font-semibold text-sm">
                  {formatHours(projectHours[project.id] || 0)}
                </div>
                <div className="text-xs text-gray-600">total</div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => handleDelete(project.id, e)}
                  className="text-gray-700 hover:text-red-400 transition-colors p-1.5 rounded opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
