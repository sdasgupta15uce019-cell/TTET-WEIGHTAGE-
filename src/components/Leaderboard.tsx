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
  selectedPaper?: 'paper1' | 'paper2';
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
  onUnverify,
  selectedPaper
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
    <>
      <div className="bg-white rounded-3xl overflow-hidden relative shadow-xl border border-zinc-200/60 ring-1 ring-yellow-400/30 shadow-[0_10px_40px_-10px_rgba(250,204,21,0.2)]">
        <div className="p-3 sm:p-4 border-b border-zinc-100 flex items-center justify-between gap-4 bg-gradient-to-b from-yellow-100/80 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100/40 backdrop-blur-md border border-amber-200/50 flex items-center justify-center text-amber-600 shadow-sm">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-zinc-800 drop-shadow-sm leading-tight">Merit Leaderboard {selectedPaper === 'paper1' ? '(Paper 1)' : '(Paper 2)'}</h2>
              <p className="text-xs font-medium text-zinc-500">
                Showing {filteredRecords.length} candidates
              </p>
            </div>
          </div>
        </div>

        <div className="px-2 sm:px-6 pb-6 pt-4">
          <div className="w-full">
          {/* Header Pill */}
          <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-full px-4 py-3 mb-4 shadow-sm sticky top-4 z-20">
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
                  className="flex flex-col"
                >
                  {filteredRecords.map((record, index) => (
                    <div
                      key={record.id}
                      className="flex items-center bg-transparent border-b border-zinc-200/60 px-2 sm:px-4 py-3 hover:bg-zinc-50/80 transition-all group last:border-b-0"
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
                    
                    <div className="flex-1 min-w-0 pr-2 relative">
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

                    <div className="w-24 sm:w-28 text-right shrink-0 relative flex items-center justify-end">
                      {index === 0 && (
                        <img 
                          src="https://i.postimg.cc/4xJy0mW9/hd-real-gold-and-red-king-crown-png-704081695122649zm2izk6f2p.png" 
                          alt="Crown" 
                          className="w-6 h-6 sm:w-8 sm:h-8 object-contain absolute -left-1 sm:-left-4"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className={`text-xs sm:text-lg font-bold tabular-nums w-full ${record.isVerified === false ? 'text-red-600' : 'text-emerald-600'}`}>
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
                  </div>
                ))
                }
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

