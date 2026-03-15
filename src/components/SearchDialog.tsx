import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, CheckCircle, XCircle, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CandidateRecord } from '../types';
import { candidatesData } from '../data/candidates';

interface SearchDialogProps {
  records: CandidateRecord[];
  onVerify?: (id: string, rollNo: string) => void;
  isAdmin?: boolean;
  isLoading?: boolean;
}

export const SearchDialog: React.FC<SearchDialogProps> = ({ records, onVerify, isAdmin, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [resultId, setResultId] = useState<string | null>(null);
  const [unregisteredCandidate, setUnregisteredCandidate] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [verifyRollNo, setVerifyRollNo] = useState('');

  const searchableRecords = isAdmin ? records : records.filter(r => !r.isHidden);
  const currentRecord = resultId ? searchableRecords.find(r => r.id === resultId) : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResultId(null);
    setUnregisteredCandidate(null);
    setVerifyRollNo('');

    if (isLoading) {
      setError('Database is still loading. Please wait a moment and try again.');
      return;
    }

    if (!searchValue.trim()) {
      setError(`Please enter a valid ${isAdmin ? 'Sl No' : 'phone number'}.`);
      return;
    }

    let record;
    const trimmedValue = searchValue.trim();

    if (isAdmin) {
      const slNo = parseInt(trimmedValue, 10);
      if (isNaN(slNo)) {
        setError('Please enter a valid Sl No (number).');
        return;
      }
      record = searchableRecords.find(r => r.slNo !== undefined && Number(r.slNo) === slNo);
      
      if (!record) {
        // Search in master list (candidatesData)
        const masterCandidate = candidatesData.find(c => c.slNo === slNo);
        if (masterCandidate) {
          setUnregisteredCandidate(masterCandidate);
          return;
        }
      }
    } else {
      // Normalize search value: remove non-digits
      const normalizedSearch = trimmedValue.replace(/\D/g, '');
      
      // Handle +91 or 0 prefix (standardize to 10 digits if possible)
      const getStandardPhone = (p: string) => {
        const digits = p.replace(/\D/g, '');
        if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
        if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
        return digits;
      };

      const searchPhone = getStandardPhone(normalizedSearch);

      record = searchableRecords.find(r => {
        const rPhone = getStandardPhone(r.phone || r.id || '');
        return rPhone === searchPhone;
      });

      if (!record) {
        // Check if it's hidden (to give a better message)
        const hiddenRecord = records.find(r => {
          const rPhone = getStandardPhone(r.phone || r.id || '');
          return r.isHidden && rPhone === searchPhone;
        });

        if (hiddenRecord) {
          setError("Your record has been hidden by an administrator. Please contact support if you think this is a mistake.");
          return;
        }
      }
    }
    
    if (!record) {
      setError(`No record found with this ${isAdmin ? 'Sl No' : 'phone number'}${isAdmin ? '' : ' on the public leaderboard'}.`);
      return;
    }

    setResultId(record.id || null);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setSearchValue('');
    setResultId(null);
    setUnregisteredCandidate(null);
    setError('');
    setVerifyRollNo('');
  };

  let allRank: number | null = null;
  let categoryRank: number | null = null;

  if (currentRecord) {
    const visibleRecords = records.filter(r => !r.isHidden);
    allRank = currentRecord.scoreTET2 >= 90 
      ? visibleRecords.filter(r => r.scoreTET2 >= 90 && r.finalScore > currentRecord.finalScore).length + 1 
      : null;
    categoryRank = visibleRecords.filter(r => r.category === currentRecord.category && r.finalScore > currentRecord.finalScore).length + 1;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-full sm:w-40 px-2 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider text-red-700 hover:text-red-800 glass-morphism-button"
        title="Search Your Rank"
      >
        <span className="whitespace-nowrap relative z-10">Search Your Rank</span>
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
                transition={{ type: "spring", damping: 12, stiffness: 400 }}
                className="glass-morphism w-full max-w-md overflow-hidden rounded-3xl"
              >
                <div className="flex items-center justify-between p-4 border-b border-white/40 bg-white/30 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-zinc-900">Search Your Rank</h3>
              </div>
              <button
                onClick={closeDialog}
                className="glass-morphism-button-red p-2 rounded-full flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5 text-white stroke-[3] drop-shadow-md" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-2">
                    {isAdmin ? 'Enter Sl No' : 'Enter Phone Number'}
                  </label>
                  <input
                    type={isAdmin ? "number" : "tel"}
                    required
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={isAdmin ? "e.g. 1" : "e.g. 9876543210"}
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
                    {isAdmin && currentRecord.slNo && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider">Sl No</span>
                        <span className="font-bold text-emerald-900">{currentRecord.slNo}</span>
                      </div>
                    )}
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

              {unregisteredCandidate && (
                <div className="mt-6 p-6 rounded-2xl bg-amber-50/50 border border-amber-100 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-amber-700">
                      <UserPlus className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">Official Record Found</span>
                    </div>
                    <span className="px-2 py-1 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                      Not Registered
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest mb-1">Name</div>
                      <div className="text-base font-bold text-zinc-900">{unregisteredCandidate.name}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest mb-1">Sl No</div>
                      <div className="text-sm font-semibold text-zinc-700">#{unregisteredCandidate.slNo}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest mb-1">Category</div>
                      <div className="text-sm font-semibold text-zinc-700">{unregisteredCandidate.category}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest mb-1">TET Marks</div>
                      <div className="text-sm font-semibold text-zinc-700">{unregisteredCandidate.tetMarks}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest mb-1">Roll No</div>
                      <div className="text-sm font-mono text-zinc-600">{unregisteredCandidate.rollNo}</div>
                    </div>
                  </div>

                  <div className="mt-6 p-3 rounded-lg bg-white/50 border border-amber-200/50 text-center">
                    <p className="text-xs text-amber-800 font-medium">
                      This candidate has not yet calculated their weightage on this platform.
                    </p>
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
