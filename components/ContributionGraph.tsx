'use client';

import React, { useState, useMemo } from 'react';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface ContributionGraphProps {
  data: number[];
  totalContributions: number;
}

// Custom tooltip component with glassmorphism styling
interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { displayDate: string; contributions: number } }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-lg p-3 shadow-xl">
        <p className="text-white/90 text-sm font-medium">{data.displayDate}</p>
        <p className="text-green-400 text-xs">
          {data.contributions} contribution{data.contributions !== 1 ? 's' : ''}
        </p>
      </div>
    );
  }
  return null;
};

interface ContributionGraphProps {
  data: number[];
  username: string;
  totalContributions: number;
}

export default function ContributionGraph({ data, totalContributions }: ContributionGraphProps) {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Process data for chart
  const chartData = useMemo(() => {
    const paddedData = [...data];
    while (paddedData.length < 365) {
      paddedData.unshift(0);
    }
    const recentData = paddedData.slice(-365);

    if (viewMode === 'daily') {
      // Show last 30 days for daily view
      return recentData.slice(-30).map((count, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          period: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          date: date.toISOString().split('T')[0],
          contributions: count,
          displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
      });
    } else if (viewMode === 'weekly') {
      // Group by weeks (52 weeks)
      const weeklyData = [];
      for (let i = 0; i < 52; i++) {
        const weekStart = i * 7;
        const weekEnd = Math.min(weekStart + 7, recentData.length);
        const weekContributions = recentData.slice(weekStart, weekEnd).reduce((sum, day) => sum + day, 0);
        const weekDate = new Date();
        weekDate.setDate(weekDate.getDate() - (52 - i) * 7);
        weeklyData.push({
          period: `W${i + 1}`,
          date: weekDate.toISOString().split('T')[0],
          contributions: weekContributions,
          displayDate: weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
      }
      return weeklyData.slice(-26); // Show last 26 weeks (6 months)
    } else {
      // Group by months (12 months)
      const monthlyData = [];
      for (let i = 0; i < 12; i++) {
        const monthStart = i * 30;
        const monthEnd = Math.min(monthStart + 30, recentData.length);
        const monthContributions = recentData.slice(monthStart, monthEnd).reduce((sum, day) => sum + day, 0);
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - (12 - i));
        monthlyData.push({
          period: monthDate.toLocaleDateString('en-US', { month: 'short' }),
          date: monthDate.toISOString().split('T')[0],
          contributions: monthContributions,
          displayDate: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        });
      }
      return monthlyData;
    }
  }, [data, viewMode]);

  // Calculate stats
  const stats = useMemo(() => {
    const recentData = data.slice(-365);
    const maxDaily = Math.max(...recentData);
    const avgDaily = totalContributions / recentData.length;
    const maxPeriod = Math.max(...chartData.map(d => d.contributions));
    
    // Calculate trend
    const firstHalf = chartData.slice(0, Math.floor(chartData.length / 2));
    const secondHalf = chartData.slice(Math.floor(chartData.length / 2));
    const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.contributions, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.contributions, 0) / secondHalf.length;
    const trend = secondHalfAvg - firstHalfAvg;

    return {
      maxDaily,
      avgDaily,
      maxPeriod,
      trend,
      isPositiveTrend: trend >= 0
    };
  }, [data, chartData, totalContributions]);

  return (
    <div className="relative rounded-xl border border-white/10 p-3 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        backdropFilter: 'blur(10px)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
      }}>
      <div className="relative z-10">
        {/* Header with View Toggle - Compact */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-white/70" />
            <span className="text-white/80 font-medium text-xs">Activity</span>
          </div>
          <div className="flex rounded-lg border border-white/10"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)',
            }}>
            {['daily', 'weekly', 'monthly'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as 'daily' | 'weekly' | 'monthly')}
                className={`px-2 py-0.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === mode
                    ? 'bg-white/10 text-white/90 border border-white/20'
                    : 'text-white/50 hover:text-white/70'
                }`}
                style={{ minWidth: 36 }}
              >
                {mode.charAt(0).toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Compact Stats */}
        <div className="grid grid-cols-4 gap-1 mb-2">
          <div className="text-center py-1 px-1 rounded border border-white/5"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)',
            }}>
            <div className="text-white/90 font-semibold text-xs leading-tight">{totalContributions.toLocaleString()}</div>
            <div className="text-white/40 text-xs leading-tight">Total</div>
          </div>
          <div className="text-center py-1 px-1 rounded border border-white/5"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)',
            }}>
            <div className="text-white/90 font-semibold text-xs leading-tight">{stats.avgDaily.toFixed(1)}</div>
            <div className="text-white/40 text-xs leading-tight">Avg</div>
          </div>
          <div className="text-center py-1 px-1 rounded border border-white/5"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)',
            }}>
            <div className="text-white/90 font-semibold text-xs leading-tight">{stats.maxDaily}</div>
            <div className="text-white/40 text-xs leading-tight">Max</div>
          </div>
          <div className="text-center py-1 px-1 rounded border border-white/5 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)',
            }}>
            <div className="flex items-center gap-1">
              {stats.isPositiveTrend ? (
                <TrendingUp className="w-2 h-2 text-white/60" />
              ) : (
                <TrendingDown className="w-2 h-2 text-white/60" />
              )}
              <span className="text-xs font-medium text-white/70">
                {Math.abs(stats.trend).toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Compact Bar Chart */}
        <div className="h-16 w-full mb-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="period"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 8 }}
                interval="preserveStartEnd"
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="contributions" 
                fill="url(#dynamicGradient)"
                radius={[1, 1, 0, 0]}
                className="hover:opacity-80 transition-opacity"
                animationDuration={800}
              />
              <defs>
                <linearGradient id="dynamicGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(34, 197, 94, 0.8)" stopOpacity={0.9} />
                  <stop offset="50%" stopColor="rgba(22, 163, 74, 0.6)" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="rgba(15, 118, 110, 0.4)" stopOpacity={0.5} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Level Indicator */}
        <div className="flex items-center justify-between text-xs text-white/40">
          <span>
            {viewMode === 'daily' && 'Last 30 days'}
            {viewMode === 'weekly' && 'Last 6 months'}
            {viewMode === 'monthly' && 'Last year'}
          </span>
          <div className="flex items-center gap-1">
            <span>Less</span>
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className="w-1.5 h-1.5 rounded-sm"
                  style={{
                    backgroundColor: level === 0 ? 'rgba(255,255,255,0.1)' : 
                      level === 1 ? 'rgba(255,255,255,0.2)' :
                      level === 2 ? 'rgba(255,255,255,0.4)' :
                      level === 3 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.8)'
                  }}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}