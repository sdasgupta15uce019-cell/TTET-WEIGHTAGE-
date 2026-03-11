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
  onVerifyBySlNo?: (id: string | undefined, slNo: string) => void;
  onUpdateName?: (id: string | undefined, newName: string) => void;
  onUnverify?: (id: string | undefined) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  records,
  selectedCategory,
  onCategoryChange,
  isAdmin,
  onHide,
  onRestore,
  onVerify,
  onVerifyBySlNo,
  onUpdateName,
  onUnverify
}) => {
  const visibleRecords = records.filter(r => !r.isHidden);
  const trashRecords = records.filter(r => r.isHidden);
  const [verifyRollNo, setVerifyRollNo] = useState<Record<string, string>>({});
  const [verifySlNo, setVerifySlNo] = useState<Record<string, string>>({});
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [editingRollNoId, setEditingRollNoId] = useState<string | null>(null);
  const [editRollNoValue, setEditRollNoValue] = useState('');

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
    <div className="glass-panel rounded-3xl overflow-hidden relative">
      <div className="p-6 border-b border-white/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/30 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-amber-100/50 backdrop-blur-sm flex items-center justify-center text-amber-500">
            <Trophy className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900">Merit Leaderboard</h2>
        </div>
        
        <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-2 bg-white/40 backdrop-blur-sm p-1.5 rounded-2xl overflow-x-auto border border-white/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] w-full sm:w-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`flex-1 sm:flex-none px-2 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap text-center ${
                selectedCategory === cat
                  ? cat === 'Trash' ? 'bg-red-500 text-white shadow-md' : 'bg-emerald-600 text-white shadow-md'
                  : 'text-zinc-600 hover:bg-white/50 hover:text-zinc-900'
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
            <tr className="bg-white/20 backdrop-blur-sm border-b border-white/30">
              <th className="px-1 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold text-zinc-600 uppercase tracking-widest">Rank</th>
              <th className="px-1 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold text-zinc-600 uppercase tracking-widest">Name</th>
              {isAdmin && <th className="px-2 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold text-zinc-600 uppercase tracking-widest text-center">TET Marks</th>}
              <th className="px-1 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold text-zinc-600 uppercase tracking-widest text-right">Weightage</th>
              {isAdmin && <th className="px-2 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold text-zinc-600 uppercase tracking-widest text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20">
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
                    className="hover:bg-white/40 transition-colors group backdrop-blur-sm"
                  >
                    <td className="px-1 py-3 sm:px-6 sm:py-4 w-8 sm:w-auto">
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold shadow-sm border ${
                        index === 0 ? 'bg-amber-100/80 border-amber-200 text-amber-700' :
                        index === 1 ? 'bg-zinc-200/80 border-zinc-300 text-zinc-700' :
                        index === 2 ? 'bg-orange-100/80 border-orange-200 text-orange-700' :
                        'bg-white/60 border-white/40 text-zinc-600'
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-1 py-3 sm:px-6 sm:py-4">
                      <div className="font-medium text-xs sm:text-base text-zinc-900 flex items-center gap-1 sm:gap-2 flex-wrap sm:flex-nowrap">
                        {editingNameId === record.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              className="text-sm px-2 py-1 border border-zinc-300 rounded focus:outline-none focus:border-emerald-500"
                              value={editNameValue}
                              onChange={e => setEditNameValue(e.target.value)}
                            />
                            <button
                              onClick={() => {
                                if (onUpdateName) onUpdateName(record.id, editNameValue);
                                setEditingNameId(null);
                              }}
                              className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold hover:bg-emerald-200"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingNameId(null)}
                              className="text-[10px] bg-zinc-100 text-zinc-700 px-2 py-1 rounded font-bold hover:bg-zinc-200"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            {record.name || 'Unknown Candidate'}
                            {isAdmin && onUpdateName && (
                              <button
                                onClick={() => {
                                  setEditingNameId(record.id || null);
                                  setEditNameValue(record.name || '');
                                }}
                                className="text-[10px] text-blue-500 hover:text-blue-700 underline ml-1"
                              >
                                Edit
                              </button>
                            )}
                          </>
                        )}
                        {record.gender === 'Male' && <span className="text-red-500 font-bold text-xs">M</span>}
                        {record.gender === 'Female' && <span className="text-blue-500 font-bold text-xs">F</span>}
                        {record.isVerified === true && <CheckCircle className="w-4 h-4 text-emerald-500" title="Verified" />}
                        {record.isVerified === false && <XCircle className="w-4 h-4 text-red-500" title="Verification Failed" />}
                      </div>
                      
                      {isAdmin && record.isVerified === true ? (
                        <div className="mt-2 flex items-center gap-2">
                          {editingRollNoId === record.id ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <input 
                                  type="text" 
                                  className="text-xs px-2 py-1 border border-zinc-300 rounded focus:outline-none focus:border-emerald-500 w-28"
                                  value={editRollNoValue}
                                  onChange={e => setEditRollNoValue(e.target.value)}
                                  placeholder="Roll No"
                                />
                                <button 
                                  onClick={() => {
                                    if (onVerify) onVerify(record.id, editRollNoValue);
                                    setEditingRollNoId(null);
                                  }}
                                  className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold hover:bg-emerald-200"
                                >
                                  Re-verify
                                </button>
                                <button
                                  onClick={() => setEditingRollNoId(null)}
                                  className="text-[10px] bg-zinc-100 text-zinc-700 px-2 py-1 rounded font-bold hover:bg-zinc-200"
                                >
                                  Cancel
                                </button>
                              </div>
                              {isAdmin && onVerifyBySlNo && (
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="text" 
                                    placeholder="Input Sl No" 
                                    className="text-xs px-2 py-1 border border-zinc-300 rounded focus:outline-none focus:border-blue-500 w-28"
                                    value={verifySlNo[record.id || ''] || ''}
                                    onChange={e => setVerifySlNo(prev => ({ ...prev, [record.id || '']: e.target.value }))}
                                  />
                                  <button 
                                    onClick={() => {
                                      if (onVerifyBySlNo) onVerifyBySlNo(record.id, verifySlNo[record.id || '']);
                                      setEditingRollNoId(null);
                                    }}
                                    className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold hover:bg-blue-200"
                                  >
                                    Re-verify by Sl No
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              <span className="text-xs text-zinc-600 font-mono bg-zinc-100 px-2 py-1 rounded border border-zinc-200">
                                Roll No: {record.rollNo || 'N/A'}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingRollNoId(record.id || null);
                                  setEditRollNoValue(record.rollNo || '');
                                }}
                                className="text-[10px] text-blue-500 hover:text-blue-700 underline"
                              >
                                Edit
                              </button>
                              {onUnverify && (
                                <button
                                  onClick={() => onUnverify(record.id)}
                                  className="text-[10px] text-red-500 hover:text-red-700 underline"
                                >
                                  Unverify
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      ) : (record.isVerified !== true) && onVerify ? (
                        <div className="mt-2 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <input 
                              type="text" 
                              placeholder="Input Roll No" 
                              className="text-xs px-2 py-1 border border-zinc-300 rounded focus:outline-none focus:border-emerald-500 w-28"
                              value={verifyRollNo[record.id || ''] || ''}
                              onChange={e => setVerifyRollNo(prev => ({ ...prev, [record.id || '']: e.target.value }))}
                            />
                            <button 
                              onClick={() => onVerify(record.id, verifyRollNo[record.id || ''])}
                              className={`text-[10px] ${record.isVerified === false ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'} px-2 py-1 rounded font-bold transition-colors`}
                            >
                              {record.isVerified === false ? 'Reverify' : 'Verify'}
                            </button>
                          </div>
                          {isAdmin && onVerifyBySlNo && (
                            <div className="flex items-center gap-2">
                              <input 
                                type="text" 
                                placeholder="Input Sl No" 
                                className="text-xs px-2 py-1 border border-zinc-300 rounded focus:outline-none focus:border-blue-500 w-28"
                                value={verifySlNo[record.id || ''] || ''}
                                onChange={e => setVerifySlNo(prev => ({ ...prev, [record.id || '']: e.target.value }))}
                              />
                              <button 
                                onClick={() => onVerifyBySlNo(record.id, verifySlNo[record.id || ''])}
                                className={`text-[10px] ${record.isVerified === false ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'} px-2 py-1 rounded font-bold transition-colors`}
                              >
                                {record.isVerified === false ? 'Reverify by Sl No' : 'Verify by Sl No'}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : null}

                      {record.scoreTET2 < 90 && selectedCategory !== 'Trash' && selectedCategory !== 'All' && (
                        <div className="text-[10px] text-red-500 font-bold mt-0.5">(reserved)</div>
                      )}
                      {record.scoreTET2 >= 90 && (record.category === 'SC' || record.category === 'ST' || record.category === 'PH') && selectedCategory !== 'Trash' && (
                        <div className="text-[10px] text-emerald-600 font-bold mt-0.5">(Recommended against UR)</div>
                      )}
                      <div className="text-[10px] sm:text-xs text-zinc-500 mt-0.5 sm:mt-1">{record.category || 'Unknown'} Category</div>
                    </td>
                    {isAdmin && (
                      <td className="px-2 py-3 sm:px-6 sm:py-4 text-center">
                        <div className="inline-block px-1.5 py-0.5 sm:px-2 sm:py-1 bg-purple-50 text-purple-700 text-[10px] sm:text-xs font-bold rounded-md border border-purple-200 tabular-nums">
                          {typeof record.scoreTET2 === 'number' ? record.scoreTET2.toFixed(2) : 'N/A'}
                        </div>
                      </td>
                    )}
                    <td className="px-1 py-3 sm:px-6 sm:py-4 text-right">
                      <div className={`text-xs sm:text-lg font-bold tabular-nums ${record.isVerified === false ? 'text-red-600' : 'text-emerald-600'}`}>
                        {typeof record.finalScore === 'number' ? record.finalScore.toFixed(2) : '0.00'}
                      </div>
                    </td>
                    {isAdmin && selectedCategory !== 'Trash' && onHide && (
                      <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
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
                      <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
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

