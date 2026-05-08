'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, BarChart2, AlertCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
  eachDayOfInterval,
  eachMonthOfInterval,
  getMonth,
  getYear,
  getISOWeek,
  isWithinInterval,
} from 'date-fns';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Project, TimeEntry } from '@/types';
import { formatHours, getMonthWeeks } from '@/lib/utils';

type Period = 'week' | 'month' | 'year';

interface ChartDataPoint {
  label: string;
  hours: number;
}

interface ProjectBreakdown {
  project: Project;
  hours: number;
  percentage: number;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
        <p className="text-gray-300 mb-1">{label}</p>
        <p className="text-amber-500 font-semibold">{formatHours(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [projectBreakdown, setProjectBreakdown] = useState<ProjectBreakdown[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);

  const getPeriodRange = useCallback((d: Date, p: Period) => {
    switch (p) {
      case 'week':
        return { start: startOfWeek(d, { weekStartsOn: 1 }), end: endOfWeek(d, { weekStartsOn: 1 }) };
      case 'month':
        return { start: startOfMonth(d), end: endOfMonth(d) };
      case 'year':
        return { start: startOfYear(d), end: endOfYear(d) };
    }
  }, []);

  const getPeriodLabel = useCallback((d: Date, p: Period) => {
    switch (p) {
      case 'week': {
        const start = startOfWeek(d, { weekStartsOn: 1 });
        const end = endOfWeek(d, { weekStartsOn: 1 });
        if (getMonth(start) === getMonth(end)) {
          return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`;
        }
        return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
      }
      case 'month':
        return format(d, 'MMMM yyyy');
      case 'year':
        return format(d, 'yyyy');
    }
  }, []);

  const navigate = (dir: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      switch (period) {
        case 'week':
          return dir === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1);
        case 'month':
          return dir === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1);
        case 'year':
          return dir === 'prev' ? subYears(prev, 1) : addYears(prev, 1);
      }
    });
  };

  const fetchReportData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const { start, end } = getPeriodRange(currentDate, period);
    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');

    const [entriesRes, projectsRes] = await Promise.all([
      supabase
        .from('time_entries')
        .select('project_id, date, hours')
        .gte('date', startStr)
        .lte('date', endStr)
        .eq('is_running', false),
      supabase.from('projects').select('*'),
    ]);

    const entries: TimeEntry[] = entriesRes.data || [];
    const projects: Project[] = projectsRes.data || [];

    // Build chart data
    let data: ChartDataPoint[] = [];

    if (period === 'week') {
      const days = eachDayOfInterval({ start, end });
      data = days.map((day) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayHours = entries
          .filter((e) => e.date === dayStr)
          .reduce((sum, e) => sum + (e.hours || 0), 0);
        return { label: format(day, 'EEE'), hours: Math.round(dayHours * 100) / 100 };
      });
    } else if (period === 'month') {
      const weeks = getMonthWeeks(currentDate);
      data = weeks.map((week, i) => {
        const weekHours = entries
          .filter((e) => {
            const entryDate = new Date(e.date + 'T12:00:00');
            return isWithinInterval(entryDate, { start: week[0], end: week[week.length - 1] });
          })
          .reduce((sum, e) => sum + (e.hours || 0), 0);
        return { label: `Week ${i + 1}`, hours: Math.round(weekHours * 100) / 100 };
      });
    } else {
      const months = eachMonthOfInterval({ start, end });
      data = months.map((month) => {
        const monthNum = getMonth(month);
        const yearNum = getYear(month);
        const monthHours = entries
          .filter((e) => {
            const d = new Date(e.date + 'T12:00:00');
            return getMonth(d) === monthNum && getYear(d) === yearNum;
          })
          .reduce((sum, e) => sum + (e.hours || 0), 0);
        return { label: format(month, 'MMM'), hours: Math.round(monthHours * 100) / 100 };
      });
    }

    setChartData(data);

    // Compute totals
    const total = entries.reduce((sum, e) => sum + (e.hours || 0), 0);
    setTotalHours(Math.round(total * 100) / 100);

    // Project breakdown
    const byProject: Record<string, number> = {};
    for (const entry of entries) {
      if (entry.project_id && entry.hours) {
        byProject[entry.project_id] = (byProject[entry.project_id] || 0) + entry.hours;
      }
    }

    const breakdown: ProjectBreakdown[] = Object.entries(byProject)
      .map(([pid, hrs]) => {
        const proj = projects.find((p) => p.id === pid);
        if (!proj) return null;
        return {
          project: proj,
          hours: Math.round(hrs * 100) / 100,
          percentage: total > 0 ? Math.round((hrs / total) * 100) : 0,
        };
      })
      .filter((x): x is ProjectBreakdown => x !== null)
      .sort((a, b) => b.hours - a.hours);

    setProjectBreakdown(breakdown);
    setLoading(false);
  }, [currentDate, period, getPeriodRange]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const mostActiveProject = projectBreakdown[0]?.project.name || '—';

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

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <h1 className="text-xl font-bold text-gray-100">Reports</h1>

      {/* Period Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Period Selector */}
        <div className="flex bg-gray-900 border border-gray-800 rounded-lg p-1 gap-1">
          {(['week', 'month', 'year'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => { setPeriod(p); setCurrentDate(new Date()); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                period === p
                  ? 'bg-amber-500 text-gray-950'
                  : 'text-gray-400 hover:text-gray-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2 ml-0 sm:ml-auto">
          <button
            onClick={() => navigate('prev')}
            className="p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-gray-200 min-w-[180px] text-center">
            {getPeriodLabel(currentDate, period)}
          </span>
          <button
            onClick={() => navigate('next')}
            className="p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Total Hours</div>
          <div className="text-2xl font-bold text-amber-500">{formatHours(totalHours)}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Most Active</div>
          <div className="text-sm font-semibold text-gray-100 truncate">{mostActiveProject}</div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        {loading ? (
          <div className="h-48 animate-pulse bg-gray-800 rounded-lg" />
        ) : chartData.every((d) => d.hours === 0) ? (
          <div className="h-48 flex flex-col items-center justify-center text-gray-600">
            <BarChart2 className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">No data for this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#374151' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}h`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(245,158,11,0.05)' }} />
              <Bar dataKey="hours" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Project Breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          By Project
        </h2>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-900 rounded-xl h-14 animate-pulse" />
            ))}
          </div>
        ) : projectBreakdown.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-600">
            <p className="text-sm">No time logged in this period.</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
            {projectBreakdown.map(({ project, hours, percentage }) => (
              <div key={project.id} className="px-4 py-3">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="flex-1 text-sm font-medium text-gray-200 truncate">
                    {project.name}
                  </span>
                  <span className="text-sm font-semibold text-amber-500">{formatHours(hours)}</span>
                  <span className="text-xs text-gray-500 w-10 text-right">{percentage}%</span>
                </div>
                <div className="ml-6 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%`, backgroundColor: project.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
