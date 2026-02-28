import React from 'react';
import { CandidateRecord, Category, FilterCategory } from '../types';
import { Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LeaderboardProps {
  records: CandidateRecord[];
  selectedCategory: FilterCategory;
  onCategoryChange: (category: FilterCategory) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  records,
  selectedCategory,
  onCategoryChange
}) => {
  const filteredRecords = selectedCategory === 'All' 
    ? records 
    : records.filter(r => r.category === selectedCategory);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
      <div className="p-6 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-semibold text-zinc-900">Merit Leaderboard</h2>
        </div>
        
        <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl">
          {(['All', 'UR', 'SC', 'ST'] as FilterCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-50/50">
              <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Candidate</th>
              <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Merit Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            <AnimatePresence mode="popLayout">
              {filteredRecords.length === 0 ? (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td colSpan={3} className="px-6 py-12 text-center text-zinc-400 italic">
                    No records found for {selectedCategory}
                  </td>
                </motion.tr>
              ) : (
                filteredRecords.map((record, index) => (
                  <motion.tr
                    key={record.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="hover:bg-zinc-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-amber-100 text-amber-700' :
                        index === 1 ? 'bg-zinc-200 text-zinc-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-zinc-100 text-zinc-500'
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900 flex items-center gap-2">
                        {record.name || 'Unknown Candidate'}
                        {record.gender === 'Male' && <span className="text-red-500 font-bold text-xs">M</span>}
                        {record.gender === 'Female' && <span className="text-blue-500 font-bold text-xs">F</span>}
                      </div>
                      <div className="text-xs text-zinc-500">{record.category || 'Unknown'} Category</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-lg font-bold text-emerald-600 tabular-nums">
                        {typeof record.finalScore === 'number' ? record.finalScore.toFixed(3) : '0.000'}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
};
