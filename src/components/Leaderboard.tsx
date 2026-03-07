import React, { useState } from 'react';
import { CandidateRecord, Category, FilterCategory } from '../types';
import { Trophy, EyeOff, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LeaderboardProps {
  records: CandidateRecord[];
  selectedCategory: FilterCategory;
  onCategoryChange: (category: FilterCategory) => void;
  isAdmin?: boolean;
  onHide?: (id: string | undefined) => void;
  onRestore?: (id: string | undefined) => void;
  onVerify?: (id: string | undefined, rollNo: string) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  records,
  selectedCategory,
  onCategoryChange,
  isAdmin,
  onHide,
  onRestore,
  onVerify
}) => {
  const visibleRecords = records.filter(r => !r.isHidden);
  const trashRecords = records.filter(r => r.isHidden);
  const [verifyRollNo, setVerifyRollNo] = useState<Record<string, string>>({});

  let filteredRecords: CandidateRecord[] = [];
  if (selectedCategory === 'Trash') {
    filteredRecords = trashRecords;
  } else if (selectedCategory === 'All') {
    filteredRecords = visibleRecords.filter(r => r.scoreTET2 >= 90);
  } else {
    filteredRecords = visibleRecords.filter(r => r.category === selectedCategory);
  }

  const categories: FilterCategory[] = ['All', 'UR', 'SC', 'ST', 'PH'];
  if (isAdmin) {
    categories.push('Trash');
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
      <div className="p-6 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-semibold text-zinc-900">Merit Leaderboard</h2>
        </div>
        
        <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? cat === 'Trash' ? 'bg-red-100 text-red-700 shadow-sm' : 'bg-white text-zinc-900 shadow-sm'
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
              {isAdmin && <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center">TET Marks</th>}
              <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Merit Score</th>
              {isAdmin && <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>}
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
                  <td colSpan={isAdmin ? 5 : 3} className="px-6 py-12 text-center text-zinc-400 italic">
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
                        {record.isVerified === true && <CheckCircle className="w-4 h-4 text-emerald-500" title="Verified" />}
                        {record.isVerified === false && <XCircle className="w-4 h-4 text-red-500" title="Verification Failed" />}
                      </div>
                      
                      {isAdmin && record.isVerified !== true && onVerify && (
                        <div className="mt-2 flex items-center gap-2">
                          <input 
                            type="text" 
                            placeholder="Input Roll No" 
                            className="text-xs px-2 py-1 border border-zinc-300 rounded focus:outline-none focus:border-emerald-500 w-28"
                            value={verifyRollNo[record.id || ''] || ''}
                            onChange={e => setVerifyRollNo(prev => ({ ...prev, [record.id || '']: e.target.value }))}
                          />
                          <button 
                            onClick={() => onVerify(record.id, verifyRollNo[record.id || ''])}
                            className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold hover:bg-emerald-200"
                          >
                            Verify
                          </button>
                        </div>
                      )}

                      {record.scoreTET2 < 90 && selectedCategory !== 'Trash' && selectedCategory !== 'All' && (
                        <div className="text-[10px] text-red-500 font-bold mt-0.5">(reserved)</div>
                      )}
                      {record.scoreTET2 >= 90 && (record.category === 'SC' || record.category === 'ST' || record.category === 'PH') && selectedCategory !== 'Trash' && (
                        <div className="text-[10px] text-emerald-600 font-bold mt-0.5">(Recommended against UR)</div>
                      )}
                      <div className="text-xs text-zinc-500">{record.category || 'Unknown'} Category</div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-center">
                        <div className="inline-block px-2 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-md border border-purple-200 tabular-nums">
                          {typeof record.scoreTET2 === 'number' ? record.scoreTET2.toFixed(2) : 'N/A'}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 text-right">
                      <div className={`text-lg font-bold tabular-nums ${record.isVerified === false ? 'text-red-600' : 'text-emerald-600'}`}>
                        {typeof record.finalScore === 'number' ? record.finalScore.toFixed(2) : '0.00'}
                      </div>
                    </td>
                    {isAdmin && selectedCategory !== 'Trash' && onHide && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => onHide(record.id)}
                          className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                          title="Hide Entry (Move to Trash)"
                        >
                          <EyeOff className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                    {isAdmin && selectedCategory === 'Trash' && onRestore && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => onRestore(record.id)}
                          className="text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 p-2 rounded-lg transition-colors"
                          title="Restore Entry"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </td>
                    )}
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

