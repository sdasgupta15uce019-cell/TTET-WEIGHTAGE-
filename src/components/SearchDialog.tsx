import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CandidateRecord } from '../types';

interface SearchDialogProps {
  records: CandidateRecord[];
  onVerify?: (id: string, rollNo: string) => void;
}

export const SearchDialog: React.FC<SearchDialogProps> = ({ records, onVerify }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [resultId, setResultId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [verifyRollNo, setVerifyRollNo] = useState('');

  const visibleRecords = records.filter(r => !r.isHidden);
  const currentRecord = resultId ? visibleRecords.find(r => r.id === resultId) : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResultId(null);
    setVerifyRollNo('');

    if (!phone.trim()) {
      setError('Please enter a valid phone number.');
      return;
    }

    const record = visibleRecords.find(r => r.phone === phone.trim());
    
    if (!record) {
      setError('No record found with this phone number on the public leaderboard.');
      return;
    }

    setResultId(record.id || null);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setPhone('');
    setResultId(null);
    setError('');
    setVerifyRollNo('');
  };

  let allRank: number | null = null;
  let categoryRank: number | null = null;

  if (currentRecord) {
    allRank = currentRecord.scoreTET2 >= 90 
      ? visibleRecords.filter(r => r.scoreTET2 >= 90 && r.finalScore > currentRecord.finalScore).length + 1 
      : null;
    categoryRank = visibleRecords.filter(r => r.category === currentRecord.category && r.finalScore > currentRecord.finalScore).length + 1;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-full sm:w-40 px-2 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider text-red-700 hover:text-red-800 bg-gradient-to-br from-white/60 to-white/20 backdrop-blur-md border border-white/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_0_30px_rgba(0,0,0,0.4)] hover:from-white/70 hover:to-white/30 hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_0_40px_rgba(0,0,0,0.6)] hover:-translate-y-0.5 transition-all duration-300"
        title="Search Your Rank"
      >
        <span className="whitespace-nowrap">Search Your Rank</span>
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              key="search-dialog-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
            >
              <motion.div 
                key="search-dialog-content"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="glass-panel w-full max-w-md overflow-hidden rounded-3xl"
              >
                <div className="flex items-center justify-between p-4 border-b border-white/40 bg-white/30 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-zinc-900">Search Your Rank</h3>
              </div>
              <button
                onClick={closeDialog}
                className="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-white/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-2">
                    Enter Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="glass-input w-full px-4 py-3 rounded-xl text-zinc-900 placeholder:text-zinc-400"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="glass-button flex-1 bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={closeDialog}
                    className="glass-button flex-1 bg-white/50 hover:bg-white/80 text-zinc-700 font-bold py-2.5 rounded-xl transition-all active:scale-[0.98] border border-white/40"
                  >
                    Close
                  </button>
                </div>
              </form>

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg text-center">
                  {error}
                </div>
              )}

              {currentRecord && (
                <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-in fade-in slide-in-from-top-2">
                  <h4 className="text-emerald-900 font-bold mb-4 text-center border-b border-emerald-200/50 pb-2">
                    Candidate Details
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider">Name</span>
                      <div className="text-right">
                        <span className="font-bold text-emerald-900 flex items-center justify-end gap-1">
                          {currentRecord.name}
                          {currentRecord.isVerified === true && <CheckCircle className="w-4 h-4 text-emerald-500" title="Verified" />}
                          {currentRecord.isVerified === false && <XCircle className="w-4 h-4 text-red-500" title="Verification Failed" />}
                        </span>
                        {currentRecord.scoreTET2 < 90 && (
                          <span className="text-[10px] text-red-500 font-bold block">(reserved)</span>
                        )}
                        {currentRecord.scoreTET2 >= 90 && (currentRecord.category === 'SC' || currentRecord.category === 'ST') && (
                          <span className="text-[10px] text-emerald-600 font-bold block">(Recommended against UR)</span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider">Gender</span>
                      <span className="font-bold text-emerald-900">{currentRecord.gender || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider">Category</span>
                      <span className="font-bold text-emerald-900">{currentRecord.category}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider">Weightage</span>
                      <span className={`font-bold ${currentRecord.isVerified === false ? 'text-red-600' : 'text-emerald-900'}`}>{currentRecord.finalScore.toFixed(2)}</span>
                    </div>
                    
                    <div className={`grid gap-3 pt-3 mt-3 border-t border-emerald-200/50 ${allRank !== null ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {allRank !== null && (
                        <div className="bg-white/60 p-2 rounded-lg text-center">
                          <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider">All Rank</span>
                          <span className="text-xl font-black text-emerald-700">#{allRank}</span>
                        </div>
                      )}
                      <div className="bg-white/60 p-2 rounded-lg text-center">
                        <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Cat. Rank</span>
                        <span className="text-xl font-black text-emerald-700">#{categoryRank}</span>
                      </div>
                    </div>

                    {currentRecord.isVerified !== true && onVerify && (
                      <div className="mt-4 pt-4 border-t border-emerald-200/50">
                        <label className="block text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">
                          Verify Your Entry
                        </label>
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            placeholder="Enter Roll No"
                            value={verifyRollNo}
                            onChange={(e) => setVerifyRollNo(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                          />
                          <button
                            onClick={() => {
                              if (verifyRollNo.trim() && currentRecord.id) {
                                onVerify(currentRecord.id, verifyRollNo.trim());
                              }
                            }}
                            className={`w-full ${currentRecord.isVerified === false ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors`}
                          >
                            {currentRecord.isVerified === false ? 'Reverify' : 'Verify'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>
            </motion.div>
          </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
