'use client';

import type { LiveGame } from '@/types';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';

interface GameCardProps {
  game: LiveGame;
}

export default function GameCard({ game }: GameCardProps) {
  const getStatusColor = () => {
    switch (game.status) {
      case 'live':
        return 'bg-green-500';
      case 'halftime':
        return 'bg-yellow-500';
      case 'finished':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getStatusText = () => {
    switch (game.status) {
      case 'live':
        return `Q${game.quarter} - ${game.time_remaining}`;
      case 'halftime':
        return 'Halftime';
      case 'finished':
        return 'Final';
      default:
        return 'Scheduled';
    }
  };

  const formatSpread = (spread: number) => {
    if (spread === 0) return 'PK';
    return spread > 0 ? `+${spread}` : spread.toString();
  };

  const formatMoneyline = (ml: number) => {
    return ml > 0 ? `+${ml}` : ml.toString();
  };

  return (
    <div className="game-card bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-mai-500/50">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-gray-400">{game.league}</span>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${getStatusColor()} ${
              game.status === 'live' ? 'animate-pulse' : ''
            }`}
          />
          <span className="text-xs font-medium text-gray-300">
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Teams & Scores */}
      <div className="space-y-2">
        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-white">
              {game.away_team}
            </span>
            {game.away_lead > 0 && (
              <TrendingUp className="w-4 h-4 text-green-400" />
            )}
          </div>
          <span className="text-2xl font-bold text-white">{game.away_score}</span>
        </div>

        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-white">
              {game.home_team}
            </span>
            {game.home_lead > 0 && (
              <TrendingUp className="w-4 h-4 text-green-400" />
            )}
          </div>
          <span className="text-2xl font-bold text-white">{game.home_score}</span>
        </div>
      </div>

      {/* Betting Info */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-gray-500 mb-1">Spread</p>
            <p className="text-sm font-medium text-mai-400">
              {formatSpread(game.spread_home)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">ML Home</p>
            <p className="text-sm font-medium text-mai-400">
              {formatMoneyline(game.moneyline_home)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Total</p>
            <p className="text-sm font-medium text-mai-400">{game.total_line}</p>
          </div>
        </div>
      </div>

      {/* Lead Indicator */}
      {game.status === 'live' && Math.abs(game.home_lead) > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Current Lead</span>
            <span
              className={`font-bold ${
                game.home_lead > 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {game.home_lead > 0 ? game.home_team : game.away_team}{' '}
              {game.home_lead > 0 ? '+' : ''}
              {Math.abs(game.home_lead)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
