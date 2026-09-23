"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/auth";
import {
  Users, TrendingUp, Coins, Activity, UserPlus, Star,
  Bomb, CircleDot, Dices, AlignEndHorizontal, Flame,
  PackageOpen, Swords, RefreshCw, Crown, Gamepad2, Zap
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Overview {
  totalUsers: number;
  totalWagered: number;
  casinoPot: number;
  activeToday: number;
  newUsersToday: number;
  newUsersThisWeek: number;
}

interface RevenueRow { game: string; wagered: number; count: number; }
interface TrendPoint { date: string; wagered?: number; count?: number; }
interface TopPlayer { id: number; username: string; totalWagered: number; mockBalance: number; level: number; }
interface VipRow { tier: string; count: number; }
interface GameBreakdown { [key: string]: number; }

interface Analytics {
  overview: Overview;
  revenueByGame: RevenueRow[];
  topPlayers: TopPlayer[];
  registrationsTrend: TrendPoint[];
  wagerTrend: TrendPoint[];
  gameBreakdown: GameBreakdown;
  vipDistribution: VipRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDL(subunits: number) {
  return (subunits / 100).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function shortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ─── SVG Area Chart ──────────────────────────────────────────────────────────

function AreaChart({ data, color, label }: { data: number[]; color: string; label: string }) {
  const W = 400, H = 80, PAD = 4;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = PAD + (i / Math.max(data.length - 1, 1)) * (W - 2 * PAD);
    const y = H - PAD - ((v / max) * (H - 2 * PAD));
    return `${x},${y}`;
  });
  const polyline = pts.join(' ');
  const last = pts[pts.length - 1];
  const first = pts[0];
  const area = `${first.split(',')[0]},${H} ${polyline} ${last.split(',')[0]},${H}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#grad-${label})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ─── SVG Bar Chart ───────────────────────────────────────────────────────────

function BarChart({ data, labels, color }: { data: number[]; labels: string[]; color: string }) {
  const W = 400, H = 80, PAD = 4;
  const max = Math.max(...data, 1);
  const barW = (W - 2 * PAD) / data.length - 3;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16" preserveAspectRatio="none">
      {data.map((v, i) => {
        const x = PAD + i * ((W - 2 * PAD) / data.length) + 1.5;
        const barH = ((v / max) * (H - 2 * PAD));
        const y = H - PAD - barH;
        return (
          <rect key={i} x={x} y={y} width={barW} height={barH || 1}
            fill={color} opacity={v > 0 ? 0.8 : 0.15} rx="2" />
        );
      })}
    </svg>
  );
}

// ─── VIP Donut ───────────────────────────────────────────────────────────────

const VIP_COLORS: Record<string, string> = {
  Diamond: '#22d3ee',
  Platinum: '#a78bfa',
  Gold: '#fbbf24',
  Silver: '#94a3b8',
  Bronze: '#f97316',
};

function VipDonut({ data }: { data: VipRow[] }) {
  const total = data.reduce((s, r) => s + r.count, 0) || 1;
  const R = 36, cx = 44, cy = 44, strokeW = 14;
  const circ = 2 * Math.PI * R;

  let offset = 0;
  const segments = data.map((row) => {
    const pct = row.count / total;
    const seg = { ...row, dasharray: pct * circ, dashoffset: -offset * circ };
    offset += pct;
    return seg;
  });

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 88 88" className="w-24 h-24 flex-shrink-0">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#1a1f2e" strokeWidth={strokeW} />
        {segments.map((s) => (
          <circle
            key={s.tier}
            cx={cx} cy={cy} r={R}
            fill="none"
            stroke={VIP_COLORS[s.tier] || '#555'}
            strokeWidth={strokeW}
            strokeDasharray={`${s.dasharray} ${circ - s.dasharray}`}
            strokeDashoffset={s.dashoffset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ))}
        <text x={cx} y={cy + 5} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">{total}</text>
      </svg>
      <div className="flex flex-col gap-1.5 flex-1">
        {data.map((row) => (
          <div key={row.tier} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: VIP_COLORS[row.tier] }} />
              <span className="text-[#a0a8c0] font-semibold">{row.tier}</span>
            </div>
            <span className="font-black text-white">{row.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-[#131620] border border-[#222738] rounded-2xl p-5 flex flex-col gap-3 hover:border-[#2e364c] transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#7f86a2] uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div>
        <div className="text-2xl font-black text-white">{value}</div>
        {sub && <div className="text-[10px] text-[#5d6480] font-semibold mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Game icons map ──────────────────────────────────────────────────────────

const GAME_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  coinflip: { label: 'Coinflip', icon: Coins,               color: '#fbbf24' },
  mines:    { label: 'Mines',    icon: Bomb,                color: '#f87171' },
  roulette: { label: 'Roulette', icon: CircleDot,           color: '#34d399' },
  crash:    { label: 'Crash',    icon: Activity,            color: '#60a5fa' },
  dice:     { label: 'Dice',     icon: Dices,               color: '#c084fc' },
  plinko:   { label: 'Plinko',   icon: AlignEndHorizontal,  color: '#f472b6' },
  slots:    { label: 'Slots',    icon: Gamepad2,            color: '#fb923c' },
  cases:    { label: 'Cases',    icon: PackageOpen,         color: '#22d3ee' },
  battles:  { label: 'Battles',  icon: Swords,              color: '#f97316' },
  jackpot:  { label: 'Jackpot',  icon: Flame,               color: '#facc15' },
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/admin/analytics');
      if (res.ok) {
        setData(await res.json());
        setLastRefresh(new Date());
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <RefreshCw size={28} className="animate-spin text-cyan-400 mx-auto" />
          <p className="text-xs font-bold text-[#7f86a2] uppercase tracking-widest">Loading Analytics…</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { overview, revenueByGame, topPlayers, registrationsTrend, wagerTrend, gameBreakdown, vipDistribution } = data;

  const wagerValues = wagerTrend.map(p => p.wagered ?? 0);
  const regValues = registrationsTrend.map(p => p.count ?? 0);
  const regLabels = registrationsTrend.map(p => shortDate(p.date));
  const wagerLabels = wagerTrend.map(p => shortDate(p.date));

  const totalGamePlays = Object.values(gameBreakdown).reduce((a, b) => a + b, 0) || 1;
  const maxGamePlays = Math.max(...Object.values(gameBreakdown), 1);
  const maxRevenue = revenueByGame[0]?.wagered || 1;

  return (
    <div className="space-y-6">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <TrendingUp className="text-cyan-400" size={20} /> Analytics
          </h2>
          <p className="text-xs text-[#7f86a2] font-medium mt-0.5">
            Live aggregated stats from the DB
            {lastRefresh && ` · Last updated ${lastRefresh.toLocaleTimeString()}`}
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 bg-[#1b1f2c] border border-[#2a3044] rounded-xl text-xs font-black text-[#7f86a2] hover:text-white transition-colors"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Total Users"    value={overview.totalUsers.toLocaleString()}                    icon={Users}      color="#22d3ee" />
        <KpiCard label="Total Wagered"  value={`${fmtDL(overview.totalWagered)} DL`}  sub="all-time"   icon={TrendingUp} color="#34d399" />
        <KpiCard label="Casino Pot"     value={`${fmtDL(overview.casinoPot)} DL`}     sub="house edge" icon={Coins}      color="#fbbf24" />
        <KpiCard label="Active Today"   value={overview.activeToday.toLocaleString()}  sub="placed a bet" icon={Activity} color="#60a5fa" />
        <KpiCard label="New Today"      value={overview.newUsersToday.toLocaleString()}                 icon={UserPlus}   color="#f472b6" />
        <KpiCard label="New This Week"  value={overview.newUsersThisWeek.toLocaleString()}              icon={Star}       color="#c084fc" />
      </div>

      {/* ── Trend Charts Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#131620] border border-[#222738] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white">Wager Trend</h3>
              <p className="text-[10px] text-[#5d6480] font-semibold">14-day daily wagered</p>
            </div>
            <span className="text-xs font-black text-cyan-400">
              {fmtDL(wagerValues.reduce((a, b) => a + b, 0))} DL
            </span>
          </div>
          <AreaChart data={wagerValues} color="#22d3ee" label="wager" />
          <div className="flex justify-between text-[9px] text-[#3d4460] font-semibold">
            <span>{wagerLabels[0]}</span><span>{wagerLabels[wagerLabels.length - 1]}</span>
          </div>
        </div>

        <div className="bg-[#131620] border border-[#222738] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white">Registrations</h3>
              <p className="text-[10px] text-[#5d6480] font-semibold">14-day new signups</p>
            </div>
            <span className="text-xs font-black text-emerald-400">
              +{regValues.reduce((a, b) => a + b, 0)} users
            </span>
          </div>
          <BarChart data={regValues} labels={regLabels} color="#34d399" />
          <div className="flex justify-between text-[9px] text-[#3d4460] font-semibold">
            <span>{regLabels[0]}</span><span>{regLabels[regLabels.length - 1]}</span>
          </div>
        </div>
      </div>

      {/* ── Game Breakdown + VIP Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#131620] border border-[#222738] rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Gamepad2 size={15} className="text-accent-green" /> Game Breakdown
            </h3>
            <p className="text-[10px] text-[#5d6480] font-semibold">All-time plays per game</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {Object.entries(gameBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([key, count]) => {
                const meta = GAME_META[key];
                if (!meta) return null;
                const Icon = meta.icon;
                const pct = ((count / totalGamePlays) * 100).toFixed(1);
                const barPct = (count / maxGamePlays) * 100;
                return (
                  <div key={key} className="flex items-center gap-3 bg-[#0e1017] rounded-xl p-3 border border-[#1d2230]">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${meta.color}18` }}>
                      <Icon size={15} style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-white truncate">{meta.label}</span>
                        <span className="text-[10px] font-bold text-[#5d6480] ml-2 flex-shrink-0">{pct}%</span>
                      </div>
                      <div className="h-1 bg-[#1d2230] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${barPct}%`, background: meta.color }} />
                      </div>
                      <span className="text-[10px] text-[#5d6480] font-semibold">{count.toLocaleString()} plays</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="bg-[#131620] border border-[#222738] rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Crown size={15} className="text-amber-400" /> VIP Distribution
            </h3>
            <p className="text-[10px] text-[#5d6480] font-semibold">Users by wager tier</p>
          </div>
          <VipDonut data={vipDistribution} />
        </div>
      </div>

      {/* ── Revenue by Game (last 30 days) ── */}
      {revenueByGame.length > 0 && (
        <div className="bg-[#131620] border border-[#222738] rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Zap size={15} className="text-cyan-400" /> Revenue by Game
            </h3>
            <p className="text-[10px] text-[#5d6480] font-semibold">Last 30 days · sorted by wagered</p>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {revenueByGame.slice(0, 20).map((row) => {
              const barPct = (row.wagered / maxRevenue) * 100;
              return (
                <div key={row.game} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-[#a0a8c0] w-36 truncate flex-shrink-0">{row.game}</span>
                  <div className="flex-1 h-2 bg-[#1d2230] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all"
                      style={{ width: `${barPct}%` }} />
                  </div>
                  <span className="text-xs font-black text-white w-24 text-right flex-shrink-0">
                    {fmtDL(row.wagered)} DL
                  </span>
                  <span className="text-[10px] text-[#5d6480] w-16 text-right flex-shrink-0">
                    {row.count.toLocaleString()} bets
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Top 10 Players ── */}
      <div className="bg-[#131620] border border-[#222738] rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Star size={15} className="text-amber-400" /> Top 10 Players
          </h3>
          <p className="text-[10px] text-[#5d6480] font-semibold">Ranked by all-time wagered</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#5d6480] font-bold uppercase text-[10px] tracking-wider">
                <th className="text-left pb-3">#</th>
                <th className="text-left pb-3">Username</th>
                <th className="text-left pb-3">Level</th>
                <th className="text-right pb-3">Total Wagered</th>
                <th className="text-right pb-3">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1d2230]">
              {topPlayers.map((p, i) => (
                <tr key={p.id} className="hover:bg-[#0e1017] transition-colors">
                  <td className="py-2.5 pr-3">
                    <span className={`font-black text-sm ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-[#5d6480]'}`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-2.5"><span className="font-black text-white">{p.username}</span></td>
                  <td className="py-2.5"><span className="text-cyan-400 font-bold">Lv.{p.level}</span></td>
                  <td className="py-2.5 text-right"><span className="font-black text-emerald-400">{fmtDL(p.totalWagered)} DL</span></td>
                  <td className="py-2.5 text-right"><span className="font-semibold text-[#a0a8c0]">{fmtDL(p.mockBalance)} DL</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
