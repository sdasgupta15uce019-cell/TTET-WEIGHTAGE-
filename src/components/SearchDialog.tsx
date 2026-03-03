import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { CandidateRecord } from '../types';

interface SearchDialogProps {
  records: CandidateRecord[];
}

export const SearchDialog: React.FC<SearchDialogProps> = ({ records }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!phone.trim()) {
      setError('Please enter a valid phone number.');
      return;
    }

    const visibleRecords = records.filter(r => !r.isHidden);
    const record = visibleRecords.find(r => r.phone === phone.trim());
    
    if (!record) {
      setError('No record found with this phone number on the public leaderboard.');
      return;
    }

    const allRank = visibleRecords.filter(r => r.finalScore > record.finalScore).length + 1;
    const categoryRank = visibleRecords.filter(r => r.category === record.category && r.finalScore > record.finalScore).length + 1;

    setResult({
      ...record,
      allRank,
      categoryRank
    });
  };

  const closeDialog = () => {
    setIsOpen(false);
    setPhone('');
    setResult(null);
    setError('');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-xl text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
        title="Search Your Rank"
      >
        <Search className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50/50">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-zinc-900">Search Your Rank</h3>
              </div>
              <button
                onClick={closeDialog}
                className="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Enter Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                >
                  Search
                </button>
              </form>

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg text-center">
                  {error}
                </div>
              )}

              {result && (
                <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-in fade-in slide-in-from-top-2">
                  <h4 className="text-emerald-900 font-bold mb-4 text-center border-b border-emerald-200/50 pb-2">
                    Candidate Details
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider">Name</span>
                      <span className="font-bold text-emerald-900">{result.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider">Gender</span>
                      <span className="font-bold text-emerald-900">{result.gender || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider">Category</span>
                      <span className="font-bold text-emerald-900">{result.category}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider">Weightage</span>
                      <span className="font-bold text-emerald-900">{result.finalScore.toFixed(3)}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-3 mt-3 border-t border-emerald-200/50">
                      <div className="bg-white/60 p-2 rounded-lg text-center">
                        <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider">All Rank</span>
                        <span className="text-xl font-black text-emerald-700">#{result.allRank}</span>
                      </div>
                      <div className="bg-white/60 p-2 rounded-lg text-center">
                        <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Cat. Rank</span>
                        <span className="text-xl font-black text-emerald-700">#{result.categoryRank}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
