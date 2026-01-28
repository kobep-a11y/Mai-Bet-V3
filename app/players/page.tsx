'use client';

import { useState, useEffect } from 'react';
import { Users, RefreshCw, Trophy, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { Player } from '@/types';

type SortKey = 'winRate' | 'gamesPlayed' | 'avgMargin' | 'atsWinRate';

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>('winRate');

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/players?leaderboard=true&sortBy=${sortBy}&limit=50`);
      const data = await res.json();
      if (data.success) {
        setPlayers(data.players || []);
      }
    } catch (error) {
      console.error('Failed to fetch players:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, [sortBy]);

  // Calculate league averages
  const leagueStats = players.length > 0 ? {
    avgWinRate: Math.round(players.reduce((sum, p) => sum + p.winRate, 0) / players.length),
    avgMargin: Math.round(players.reduce((sum, p) => sum + p.avgMargin, 0) / players.length * 10) / 10,
    avgAtsWinRate: Math.round(players.reduce((sum, p) => sum + p.atsWinRate, 0) / players.length),
    totalGames: players.reduce((sum, p) => sum + p.gamesPlayed, 0),
  } : { avgWinRate: 0, avgMargin: 0, avgAtsWinRate: 0, totalGames: 0 };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-purple-500" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Player Leaderboard</h1>
            <p className="text-slate-500 text-sm">Player performance stats and rankings</p>
          </div>
        </div>
        <button
          onClick={fetchPlayers}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors text-slate-600"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* League Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-medium">Total Players</p>
          <p className="text-2xl font-bold text-slate-800">{players.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-medium">Avg Win Rate</p>
          <p className="text-2xl font-bold text-green-600">{leagueStats.avgWinRate}%</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-medium">Avg Margin</p>
          <p className={`text-2xl font-bold ${leagueStats.avgMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {leagueStats.avgMargin > 0 ? '+' : ''}{leagueStats.avgMargin}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-medium">Avg ATS Win Rate</p>
          <p className="text-2xl font-bold text-purple-600">{leagueStats.avgAtsWinRate}%</p>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex gap-2 mb-4">
        {([
          { key: 'winRate', label: 'Win Rate', icon: <Trophy className="w-4 h-4" /> },
          { key: 'gamesPlayed', label: 'Games Played', icon: <Target className="w-4 h-4" /> },
          { key: 'avgMargin', label: 'Avg Margin', icon: <TrendingUp className="w-4 h-4" /> },
          { key: 'atsWinRate', label: 'ATS Win Rate', icon: <TrendingDown className="w-4 h-4" /> },
        ] as const).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              sortBy === key
                ? 'bg-purple-100 text-purple-700 font-medium'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Players Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No players found</h3>
          <p className="text-slate-500">Players will appear here as games are played</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">#</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Player</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Team</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Record</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Win %</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Avg PF</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Avg PA</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Margin</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">ATS</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Over %</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Form</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Streak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {players.map((player, index) => (
                <tr key={player.id} className="hover:bg-slate-50 transition-colors">
                  {/* Rank */}
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-slate-200 text-slate-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {index + 1}
                    </span>
                  </td>

                  {/* Player Name */}
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800">{player.name}</span>
                  </td>

                  {/* Team */}
                  <td className="py-3 px-4">
                    <span className="text-sm text-slate-600">{player.teamName}</span>
                  </td>

                  {/* Record */}
                  <td className="py-3 px-4 text-center">
                    <span className="text-sm font-medium text-slate-700">
                      {player.wins}-{player.losses}
                    </span>
                  </td>

                  {/* Win % */}
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${
                      player.winRate >= 55 ? 'bg-green-100 text-green-700' :
                      player.winRate >= 45 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {player.winRate.toFixed(1)}%
                    </span>
                  </td>

                  {/* Avg Points For */}
                  <td className="py-3 px-4 text-center">
                    <span className="text-sm text-slate-600">{player.avgPointsFor.toFixed(1)}</span>
                  </td>

                  {/* Avg Points Against */}
                  <td className="py-3 px-4 text-center">
                    <span className="text-sm text-slate-600">{player.avgPointsAgainst.toFixed(1)}</span>
                  </td>

                  {/* Margin */}
                  <td className="py-3 px-4 text-center">
                    <span className={`text-sm font-medium ${
                      player.avgMargin >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {player.avgMargin > 0 ? '+' : ''}{player.avgMargin.toFixed(1)}
                    </span>
                  </td>

                  {/* ATS Record */}
                  <td className="py-3 px-4 text-center">
                    <div className="text-xs text-slate-600">
                      {player.spreadRecord.wins}-{player.spreadRecord.losses}
                      {player.spreadRecord.pushes > 0 && `-${player.spreadRecord.pushes}`}
                    </div>
                    <div className={`text-xs font-medium ${
                      player.atsWinRate >= 52 ? 'text-green-600' : 'text-slate-500'
                    }`}>
                      {player.atsWinRate.toFixed(1)}%
                    </div>
                  </td>

                  {/* Over % */}
                  <td className="py-3 px-4 text-center">
                    <span className={`text-sm ${
                      player.overRate >= 55 ? 'text-orange-600' :
                      player.overRate <= 45 ? 'text-blue-600' :
                      'text-slate-500'
                    }`}>
                      {player.overRate.toFixed(1)}%
                    </span>
                  </td>

                  {/* Recent Form */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      {player.recentForm.slice(0, 5).map((result, i) => (
                        <span
                          key={i}
                          className={`inline-block w-4 h-4 rounded-sm text-xs font-bold flex items-center justify-center ${
                            result === 'W' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {result}
                        </span>
                      ))}
                      {player.recentForm.length === 0 && (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </div>
                  </td>

                  {/* Streak */}
                  <td className="py-3 px-4 text-center">
                    {player.streak.count > 0 ? (
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                        player.streak.type === 'W'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {player.streak.type}{player.streak.count}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h4 className="font-medium text-slate-700 mb-2">Stats Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-slate-600">
          <div><span className="font-medium">PF</span> - Points For (avg)</div>
          <div><span className="font-medium">PA</span> - Points Against (avg)</div>
          <div><span className="font-medium">ATS</span> - Against The Spread</div>
          <div><span className="font-medium">Over %</span> - Games going over total</div>
        </div>
      </div>
    </div>
  );
}
