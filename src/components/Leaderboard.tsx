import React, { useState, useMemo } from 'react';
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
  const [verifyRollNo, setVerifyRollNo] = useState<Record<string, string>>({});
  const [verifySlNo, setVerifySlNo] = useState<Record<string, string>>({});
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [editingRollNoId, setEditingRollNoId] = useState<string | null>(null);
  const [editRollNoValue, setEditRollNoValue] = useState('');

  const filteredRecords = useMemo(() => {
    const visibleRecords = records.filter(r => !r.isHidden);
    const trashRecords = records.filter(r => r.isHidden);

    if (selectedCategory === 'Trash') {
      return trashRecords;
    } else if (selectedCategory === 'All') {
      return visibleRecords.filter(r => r.scoreTET2 >= 90);
    } else {
      return visibleRecords.filter(r => r.category === selectedCategory);
    }
  }, [records, selectedCategory]);

  const categories: FilterCategory[] = ['All', 'UR', 'SC', 'ST', 'PH'];
  if (isAdmin) {
    categories.push('Trash');
  }

  return (
    <div className="glass-panel rounded-3xl overflow-hidden relative">
      <div className="p-6 border-b border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100/40 backdrop-blur-md border border-amber-200/50 flex items-center justify-center text-amber-600 shadow-sm">
              <Trophy className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-zinc-800 drop-shadow-sm">Merit Leaderboard</h2>
          </div>
          <p className="text-sm font-medium text-zinc-500 ml-12">
            Showing {filteredRecords.length} candidates
          </p>
        </div>
        
        <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-2 bg-white/10 backdrop-blur-xl border border-white/20 shadow-[inset_0_2px_6px_rgba(0,0,0,0.05)] p-1.5 rounded-full overflow-x-auto w-full sm:w-auto relative">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`relative flex-1 sm:flex-none px-3 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs sm:text-sm font-bold uppercase transition-all whitespace-nowrap text-center group ${
                selectedCategory === cat
                  ? 'text-white'
                  : 'text-zinc-600 hover:bg-white/40 hover:text-zinc-900'
              }`}
            >
              {selectedCategory === cat && (
                <motion.div
                  layoutId="activeCategoryPill"
                  className={`absolute inset-0 rounded-full border border-white/40 backdrop-blur-md ${
                    cat === 'Trash' 
                      ? 'bg-red-500/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-2px_4px_rgba(0,0,0,0.2),0_4px_10px_rgba(239,68,68,0.3)]' 
                      : 'bg-emerald-500/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-2px_4px_rgba(0,0,0,0.2),0_4px_10px_rgba(16,185,129,0.3)]'
                  }`}
                  transition={{ type: "spring", bounce: 0.35, duration: 0.5 }}
                />
              )}
              <span className="relative z-10">{cat}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-2 sm:px-6 pb-6">
        <div className="w-full">
          {/* Header Pill */}
          <div className="flex items-center bg-white/20 backdrop-blur-xl border border-white/40 rounded-full px-4 py-3 mb-4 shadow-[inset_0_3px_6px_rgba(255,255,255,0.8),inset_0_-3px_6px_rgba(0,0,0,0.05),0_4px_10px_rgba(0,0,0,0.05)] sticky top-4 z-20">
            <div className="w-10 sm:w-16 text-center text-[10px] sm:text-xs font-bold text-zinc-600 uppercase tracking-widest shrink-0">Rank</div>
            <div className="flex-1 text-[10px] sm:text-xs font-bold text-zinc-600 uppercase tracking-widest">Name</div>
            {isAdmin && <div className="w-20 sm:w-28 text-center text-[10px] sm:text-xs font-bold text-zinc-600 uppercase tracking-widest shrink-0 hidden sm:block">TET Marks</div>}
            <div className="w-24 sm:w-28 text-right text-[10px] sm:text-xs font-bold text-zinc-600 uppercase tracking-widest shrink-0">Weightage</div>
            {isAdmin && <div className="w-16 sm:w-20 text-right text-[10px] sm:text-xs font-bold text-zinc-600 uppercase tracking-widest shrink-0">Actions</div>}
          </div>

          {/* List */}
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="wait">
              {filteredRecords.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-6 py-12 text-center text-zinc-400 italic bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40"
                >
                  No records found for {selectedCategory}
                </motion.div>
              ) : (
                <motion.div 
                  key={selectedCategory}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-3"
                >
                  {filteredRecords.map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0.4, scale: 0.85 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: false, margin: "-15% 0px -15% 0px" }}
                      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                      className="flex items-center bg-pink-50/40 backdrop-blur-md border border-white/50 rounded-full px-4 py-3 shadow-[inset_0_3px_6px_rgba(255,255,255,0.8),inset_0_-3px_6px_rgba(0,0,0,0.05),0_4px_10px_rgba(0,0,0,0.05)] hover:bg-pink-100/50 hover:shadow-[inset_0_3px_6px_rgba(255,255,255,1),inset_0_-3px_6px_rgba(0,0,0,0.08),0_6px_14px_rgba(0,0,0,0.08)] transition-all group"
                    >
                    <div className="w-10 sm:w-16 flex justify-center shrink-0">
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-sm border ${
                        index === 0 ? 'bg-amber-100/80 border-amber-200 text-amber-700' :
                        index === 1 ? 'bg-zinc-200/80 border-zinc-300 text-zinc-700' :
                        index === 2 ? 'bg-orange-100/80 border-orange-200 text-orange-700' :
                        'bg-white/60 border-white/40 text-zinc-600'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-medium text-xs sm:text-base text-zinc-900 flex items-center gap-1 sm:gap-2 min-w-0 flex-wrap sm:flex-nowrap">
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
                            <span className="truncate">{record.name || 'Unknown Candidate'}</span>
                            {isAdmin && onUpdateName && (
                              <button
                                onClick={() => {
                                  setEditingNameId(record.id || null);
                                  setEditNameValue(record.name || '');
                                }}
                                className="text-[10px] text-blue-500 hover:text-blue-700 underline ml-1 shrink-0"
                              >
                                Edit
                              </button>
                            )}
                          </>
                        )}
                        {record.gender === 'Male' && <span className="text-red-500 font-bold text-xs shrink-0">M</span>}
                        {record.gender === 'Female' && <span className="text-blue-500 font-bold text-xs shrink-0">F</span>}
                        {record.isVerified === true && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" title="Verified" />}
                        {record.isVerified === false && <XCircle className="w-4 h-4 text-red-500 shrink-0" title="Verification Failed" />}
                      </div>
                      
                      {isAdmin && record.isVerified === true ? (
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
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
                      <div className="text-[10px] sm:text-xs text-zinc-500 mt-0.5 sm:mt-1 truncate">{record.category || 'Unknown'} Category</div>
                    </div>

                    {isAdmin && (
                      <div className="w-20 sm:w-28 text-center shrink-0 hidden sm:block">
                        <div className="inline-block px-1.5 py-0.5 sm:px-2 sm:py-1 bg-purple-50 text-purple-700 text-[10px] sm:text-xs font-bold rounded-md border border-purple-200 tabular-nums">
                          {typeof record.scoreTET2 === 'number' ? record.scoreTET2.toFixed(2) : 'N/A'}
                        </div>
                      </div>
                    )}

                    <div className="w-24 sm:w-28 text-right shrink-0">
                      <div className={`text-xs sm:text-lg font-bold tabular-nums ${record.isVerified === false ? 'text-red-600' : 'text-emerald-600'}`}>
                        {typeof record.finalScore === 'number' ? record.finalScore.toFixed(2) : '0.00'}
                      </div>
                    </div>

                    {isAdmin && selectedCategory !== 'Trash' && onHide && (
                      <div className="w-16 sm:w-20 text-right shrink-0 flex justify-end">
                        <button 
                          onClick={() => onHide(record.id)}
                          className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-2 rounded-full transition-colors"
                          title="Hide Entry (Move to Trash)"
                        >
                          <EyeOff className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {isAdmin && selectedCategory === 'Trash' && onRestore && (
                      <div className="w-16 sm:w-20 text-right shrink-0 flex justify-end">
                        <button 
                          onClick={() => onRestore(record.id)}
                          className="text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 p-2 rounded-full transition-colors"
                          title="Restore Entry"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))
                }
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

