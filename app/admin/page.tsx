'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Period = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'lifetime';

type DummyMoney = { revenue: number; expenses: number; revDelta: number; expDelta: number };

// 🔧 DUMMY MONEY — swap for real payments/expenses tables later
const DUMMY_MONEY: Record<Period, DummyMoney> = {
  today:     { revenue: 15000,   expenses: 8000,   revDelta: 2000,   expDelta: 500 },
  yesterday: { revenue: 12000,   expenses: 9000,   revDelta: -1000,  expDelta: -1000 },
  week:      { revenue: 85000,   expenses: 40000,  revDelta: 15000,  expDelta: 5000 },
  month:     { revenue: 320000,  expenses: 140000, revDelta: 18000,  expDelta: -12000 },
  year:      { revenue: 1250000, expenses: 620000, revDelta: 145000, expDelta: 30000 },
  lifetime:  { revenue: 2400000, expenses: 1100000, revDelta: 0,     expDelta: 0 },
};

export default function AdminDashboard() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) setError(error.message);
      else setClients(data || []);
      setLoading(false);
    };
    run();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return <div className="p-8 text-center text-black">Loading dashboard...</div>;

  // Date-dependent rendering lives inside DashboardView and only mounts
  // after loading flips to false (client-side), so the prerender never calls new Date().
  return <DashboardView clients={clients} onLogout={handleLogout} error={error} />;
}

function DashboardView({
  clients, onLogout, error,
}: { clients: any[]; onLogout: () => void; error: string }) {
  const [period, setPeriod] = useState<Period>('month');

  const now = new Date();
  const monthName = now.toLocaleDateString('en-US', { month: 'long' });
  const yearNum = String(now.getFullYear());

  const periodOptions: { value: Period; label: string }[] = [
    { value: 'today',     label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week',      label: 'This Week' },
    { value: 'month',     label: `${monthName} ${yearNum}` },
    { value: 'year',      label: yearNum },
    { value: 'lifetime',  label: 'Lifetime' },
  ];

  const range = useMemo(() => getRange(period), [period]);

  const inRange = (c: any, start: Date, end: Date) => {
    const d = new Date(c.created_at);
    return d >= start && d < end;
  };

  const countIn = (predicate: (c: any) => boolean, start: Date, end: Date) =>
    clients.filter(c => predicate(c) && inRange(c, start, end)).length;

  const isLead       = (c: any) => ['New', 'Lead'].includes(c.status || '');
  const isDraft      = (c: any) => (c.status || 'Draft') === 'Draft';
  const isProcessing = (c: any) => ['Contacted', 'Counseling', 'Applied', 'Visa'].includes(c.status || '');
  const isAny        = (_: any) => true;

  const stats = useMemo(() => {
    const mk = (predicate: (c: any) => boolean) => {
      const curr = countIn(predicate, range.start, range.end);
      const prev = period === 'lifetime' ? 0 : countIn(predicate, range.prevStart, range.prevEnd);
      return { curr, prev };
    };
    return {
      leads:      mk(isLead),
      drafts:     mk(isDraft),
      clients:    mk(isAny),
      processing: mk(isProcessing),
    };
  }, [clients, range, period]);

  const money = DUMMY_MONEY[period];

  const pipeline = useMemo(() => {
    const buckets = ['Draft', 'New', 'Contacted', 'Counseling', 'Applied', 'Visa', 'Closed'];
    return buckets.map(b => ({
      label: b,
      count: clients.filter(c => (c.status || 'Draft') === b).length,
    }));
  }, [clients]);

  const overdue = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return clients
      .filter(c => c.follow_up_date && new Date(c.follow_up_date) < today)
      .sort((a, b) => new Date(a.follow_up_date).getTime() - new Date(b.follow_up_date).getTime())
      .slice(0, 5);
  }, [clients]);

  const upcoming = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const in7 = new Date(today); in7.setDate(in7.getDate() + 7);
    return clients
      .filter(c => {
        if (!c.follow_up_date) return false;
        const d = new Date(c.follow_up_date);
        return d >= today && d <= in7;
      })
      .sort((a, b) => new Date(a.follow_up_date).getTime() - new Date(b.follow_up_date).getTime());
  }, [clients]);

  const recent = clients.slice(0, 5);
  const netProfit = money.revenue - money.expenses;
  const maxPipeline = Math.max(1, ...pipeline.map(p => p.count));

  const fmt = (n: number) => '৳' + n.toLocaleString('en-IN');
  const periodLabel: Record<Period, string> = {
    today: 'today', yesterday: 'yesterday', week: 'this week',
    month: 'this month', year: 'this year', lifetime: 'all time',
  };

  const firstClientDate = clients.length > 0
    ? new Date(Math.min(...clients.map(c => new Date(c.created_at).getTime())))
    : null;

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Owner Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Welcome back, Administrator</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/applications" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold text-sm">All Applications</Link>
            <Link href="/" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 font-semibold text-sm">Public Form</Link>
            <button onClick={onLogout} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold text-sm">Log Out</button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">Error: {error}</div>
        )}

        {/* Period selector */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Overview period</p>
          <div className="flex flex-wrap gap-2">
            {periodOptions.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  period === p.value
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6 STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatCard
            label="Leads"
            value={stats.leads.curr}
            comparison={makeComparison(stats.leads.curr, stats.leads.prev, period, periodLabel, firstClientDate)}
            color="amber"
          />
          <StatCard
            label="Drafts"
            value={stats.drafts.curr}
            comparison={makeComparison(stats.drafts.curr, stats.drafts.prev, period, periodLabel, firstClientDate)}
            color="gray"
          />
          <StatCard
            label="Clients"
            value={stats.clients.curr}
            comparison={makeComparison(stats.clients.curr, stats.clients.prev, period, periodLabel, firstClientDate)}
            color="blue"
          />
          <StatCard
            label="Processing"
            value={stats.processing.curr}
            comparison={makeComparison(stats.processing.curr, stats.processing.prev, period, periodLabel, firstClientDate)}
            color="purple"
          />
          <StatCard
            label="Revenue"
            value={fmt(money.revenue)}
            comparison={
              period === 'lifetime'
                ? { text: 'all time', color: 'gray' }
                : { text: `${money.revDelta >= 0 ? '+' : '-'}${fmt(Math.abs(money.revDelta))} ${periodLabel[period]}`, color: money.revDelta >= 0 ? 'green' : 'red' }
            }
            color="green"
            dummy
          />
          <StatCard
            label="Expenses"
            value={fmt(money.expenses)}
            comparison={
              period === 'lifetime'
                ? { text: 'all time', color: 'gray' }
                : { text: `${money.expDelta >= 0 ? '+' : '-'}${fmt(Math.abs(money.expDelta))} ${periodLabel[period]}`, color: money.expDelta >= 0 ? 'red' : 'green' }
            }
            color="red"
            dummy
          />
        </div>

        {/* Net profit */}
        <div className={`rounded-lg p-5 mb-8 shadow ${netProfit >= 0 ? 'bg-green-600' : 'bg-red-600'}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <p className="text-white/80 text-sm font-semibold uppercase tracking-wide">
                Net Profit ({periodLabel[period]})
              </p>
              <p className="text-white text-3xl font-bold mt-1">{fmt(netProfit)}</p>
            </div>
            <p className="text-white/80 text-xs">Illustrative — will become real when payments & expenses tables go live</p>
          </div>
        </div>

        {/* Pipeline + Overdue */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-gray-800">Current Pipeline</h2>
              <Link href="/admin/applications" className="text-sm text-blue-600 hover:underline font-semibold">View all →</Link>
            </div>
            <p className="text-xs text-gray-500 mb-4">Snapshot of all clients (not affected by period filter)</p>
            <div className="space-y-3">
              {pipeline.map(p => (
                <div key={p.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{p.label}</span>
                    <span className="font-bold text-gray-900">{p.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className="bg-blue-500 h-2.5 rounded-full transition-all" style={{ width: `${(p.count / maxPipeline) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Overdue Follow-ups</h2>
            <p className="text-xs text-gray-500 mb-4">{overdue.length === 0 ? 'Nothing overdue. Nice.' : `${overdue.length} client${overdue.length > 1 ? 's' : ''} need attention`}</p>
            {overdue.length === 0 ? (
              <div className="text-sm text-gray-400 py-6 text-center">✓ All clear</div>
            ) : (
              <ul className="space-y-3">
                {overdue.map(c => (
                  <li key={c.id}>
                    <Link href={`/admin/clients/${c.id}`} className="block p-3 border border-red-200 rounded hover:bg-red-50">
                      <p className="font-semibold text-gray-800 text-sm">{c.given_name} {c.surname}</p>
                      <p className="text-xs text-red-600 font-semibold mt-0.5">Due {new Date(c.follow_up_date).toLocaleDateString()}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Recent + Upcoming */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Recent Clients</h2>
              <Link href="/admin/applications" className="text-sm text-blue-600 hover:underline font-semibold">View all →</Link>
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No submissions yet.</p>
            ) : (
              <ul className="divide-y">
                {recent.map(c => (
                  <li key={c.id} className="py-3 flex items-center justify-between">
                    <div>
                      <Link href={`/admin/clients/${c.id}`} className="font-semibold text-gray-800 hover:text-blue-600 text-sm">
                        {c.given_name} {c.surname}
                      </Link>
                      <p className="text-xs text-gray-500">{c.passport_number || '—'} · {new Date(c.created_at).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge status={c.status || 'Draft'} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Upcoming This Week</h2>
            <p className="text-xs text-gray-500 mb-4">Follow-ups scheduled in the next 7 days</p>
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">Nothing scheduled.</p>
            ) : (
              <ul className="divide-y">
                {upcoming.map(c => (
                  <li key={c.id} className="py-3 flex items-center justify-between">
                    <div>
                      <Link href={`/admin/clients/${c.id}`} className="font-semibold text-gray-800 hover:text-blue-600 text-sm">
                        {c.given_name} {c.surname}
                      </Link>
                      <p className="text-xs text-gray-500">{new Date(c.follow_up_date).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge status={c.status || 'Draft'} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}

// ---------- helpers ----------

function getRange(period: Period) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'today': {
      const end = new Date(today); end.setDate(end.getDate() + 1);
      const prevStart = new Date(today); prevStart.setDate(prevStart.getDate() - 1);
      return { start: today, end, prevStart, prevEnd: today };
    }
    case 'yesterday': {
      const start = new Date(today); start.setDate(start.getDate() - 1);
      const prevStart = new Date(today); prevStart.setDate(prevStart.getDate() - 2);
      return { start, end: today, prevStart, prevEnd: start };
    }
    case 'week': {
      const start = new Date(today); start.setDate(start.getDate() - today.getDay());
      const end = new Date(start); end.setDate(end.getDate() + 7);
      const prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 7);
      return { start, end, prevStart, prevEnd: start };
    }
    case 'month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const prevStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return { start, end, prevStart, prevEnd: start };
    }
    case 'year': {
      const start = new Date(today.getFullYear(), 0, 1);
      const end = new Date(today.getFullYear() + 1, 0, 1);
      const prevStart = new Date(today.getFullYear() - 1, 0, 1);
      return { start, end, prevStart, prevEnd: start };
    }
    case 'lifetime':
    default: {
      return {
        start: new Date(0),
        end: new Date(8640000000000000),
        prevStart: new Date(0),
        prevEnd: new Date(0),
      };
    }
  }
}

type Comparison = { text: string; color: 'green' | 'red' | 'gray' };

function makeComparison(
  curr: number,
  prev: number,
  period: Period,
  labels: Record<Period, string>,
  firstClientDate: Date | null,
): Comparison {
  if (period === 'lifetime') {
    return {
      text: firstClientDate
        ? `since ${firstClientDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
        : 'no clients yet',
      color: 'gray',
    };
  }
  const delta = curr - prev;
  if (delta === 0) return { text: `no change ${labels[period]}`, color: 'gray' };
  return {
    text: `${delta > 0 ? '+' : ''}${delta} ${labels[period]}`,
    color: delta > 0 ? 'green' : 'red',
  };
}

function StatCard({
  label, value, comparison, color, dummy = false,
}: {
  label: string;
  value: string | number;
  comparison: Comparison;
  color: 'blue' | 'gray' | 'amber' | 'purple' | 'green' | 'red';
  dummy?: boolean;
}) {
  const palette: Record<string, string> = {
    blue:   'bg-blue-50 border-blue-200 text-blue-700',
    gray:   'bg-gray-50 border-gray-200 text-gray-700',
    amber:  'bg-amber-50 border-amber-200 text-amber-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    green:  'bg-green-50 border-green-200 text-green-700',
    red:    'bg-red-50 border-red-200 text-red-700',
  };
  const cmpColor = comparison.color === 'green'
    ? 'text-green-600'
    : comparison.color === 'red'
    ? 'text-red-600'
    : 'text-gray-500';

  return (
    <div className={`rounded-lg border p-4 ${palette[color]} hover:shadow-md transition`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
      <p className={`text-[11px] font-semibold mt-1 ${cmpColor}`}>{comparison.text}</p>
      {dummy && <p className="text-[10px] mt-0.5 opacity-50">dummy</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Draft:      'bg-gray-100 text-gray-700',
    New:        'bg-blue-100 text-blue-700',
    Lead:       'bg-amber-100 text-amber-700',
    Contacted:  'bg-indigo-100 text-indigo-700',
    Counseling: 'bg-purple-100 text-purple-700',
    Applied:    'bg-cyan-100 text-cyan-700',
    Visa:       'bg-orange-100 text-orange-700',
    Closed:     'bg-green-100 text-green-700',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}