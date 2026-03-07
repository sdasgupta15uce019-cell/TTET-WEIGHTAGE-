import React, { useState } from 'react';
import { Category, CandidateRecord, Gender, FilterCategory } from '../types';
import { Calculator, Send } from 'lucide-react';

interface CalculatorFormProps {
  onSubmit: (record: Omit<CandidateRecord, 'id' | 'timestamp'>) => Promise<void>;
  records: CandidateRecord[];
  onCategoryChange: (category: FilterCategory) => void;
}

export const CalculatorForm: React.FC<CalculatorFormProps> = ({ onSubmit, records, onCategoryChange }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{name: string, allRank: number | null, categoryRank: number, score: number, category: string, scoreTET2: number} | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    gender: 'Male' as Gender,
    score12th: '',
    scoreGrad: '',
    scoreBEd: '',
    scoreTET2: '',
    category: 'UR' as Category
  });

  const calculateMerit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.phone.length !== 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const p12 = parseFloat(formData.score12th) || 0;
      const pGrad = parseFloat(formData.scoreGrad) || 0;
      const pBEd = parseFloat(formData.scoreBEd) || 0;
      const tetMarks = parseFloat(formData.scoreTET2) || 0;

      const tetPercentage = (tetMarks / 150) * 100;
      const finalScore = (p12 * 0.12) + (pGrad * 0.03) + (pBEd * 0.15) + (tetPercentage * 0.70);

      const visibleRecords = records.filter(r => !r.isHidden);
      const allRank = tetMarks >= 90 
        ? visibleRecords.filter(r => r.scoreTET2 >= 90 && r.finalScore > finalScore).length + 1 
        : null;
      const categoryRank = visibleRecords.filter(r => r.category === formData.category && r.finalScore > finalScore).length + 1;

      await onSubmit({
        name: formData.name,
        phone: formData.phone,
        gender: formData.gender,
        category: formData.category,
        score12th: p12,
        scoreGrad: pGrad,
        scoreBEd: pBEd,
        scoreTET2: tetMarks,
        finalScore: parseFloat(finalScore.toFixed(2))
      });
      
      setSubmittedResult({
        name: formData.name,
        allRank,
        categoryRank,
        score: finalScore,
        category: formData.category,
        scoreTET2: tetMarks
      });

      // Reset form
      setFormData(prev => ({
        ...prev,
        name: '',
        phone: '',
        score12th: '',
        scoreGrad: '',
        scoreBEd: '',
        scoreTET2: ''
      }));
      
    } catch (err: any) {
      console.error("Form submission error:", err);
      alert(`Failed to submit: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={calculateMerit} className="bg-white p-6 rounded-2xl shadow-sm border border-black/5 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-emerald-600" />
        <h2 className="text-xl font-semibold text-zinc-900">Merit Calculator</h2>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-1">Candidate Name</label>
          <input
            required
            type="text"
            value={formData.name}
            onChange={e => { setFormData({ ...formData, name: e.target.value }); setSubmittedResult(null); }}
            placeholder="Enter full name"
            className="w-full px-4 py-2 rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">Gender</label>
          <div className="flex gap-4">
            {(['Male', 'Female'] as Gender[]).map(g => (
              <label key={g} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="gender"
                  value={g}
                  checked={formData.gender === g}
                  onChange={() => { setFormData({ ...formData, gender: g }); setSubmittedResult(null); }}
                  className="w-4 h-4 text-emerald-600 border-zinc-300 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-zinc-700 group-hover:text-emerald-600 transition-colors">{g}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 mb-1">
            <span className="block text-xs font-bold text-zinc-900 uppercase tracking-wider">Phone Number</span>
            <span className="text-[10px] font-bold text-red-500 lowercase tracking-normal">(will be used for searching your rank)</span>
          </label>
          <input
            required
            type="tel"
            pattern="[0-9]{10}"
            title="Please enter a valid 10-digit phone number"
            value={formData.phone}
            onChange={e => { 
              setFormData({ ...formData, phone: e.target.value }); 
              setSubmittedResult(null);
            }}
            placeholder="e.g. 9876543210"
            className="w-full px-4 py-2 rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-1">Class 12th %</label>
            <input
              required
              type="number"
              step="0.01"
              value={formData.score12th}
              onChange={e => { setFormData({ ...formData, score12th: e.target.value }); setSubmittedResult(null); }}
              placeholder="e.g. 85.5"
              className="w-full px-4 py-2 rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-1">Graduation %</label>
            <input
              required
              type="number"
              step="0.01"
              value={formData.scoreGrad}
              onChange={e => { setFormData({ ...formData, scoreGrad: e.target.value }); setSubmittedResult(null); }}
              placeholder="e.g. 70.2"
              className="w-full px-4 py-2 rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-1">B.Ed / D.El.Ed %</label>
            <input
              required
              type="number"
              step="0.01"
              value={formData.scoreBEd}
              onChange={e => { setFormData({ ...formData, scoreBEd: e.target.value }); setSubmittedResult(null); }}
              placeholder="e.g. 80.0"
              className="w-full px-4 py-2 rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-1">TET 2 Marks</label>
            <input
              required
              type="number"
              step="0.01"
              max="150"
              value={formData.scoreTET2}
              onChange={e => { 
                const val = e.target.value;
                const tet2 = parseFloat(val);
                let newCat = formData.category;
                
                if (!isNaN(tet2)) {
                  if (tet2 < 90 && newCat === 'UR') {
                    newCat = 'SC';
                  } else if (tet2 >= 90) {
                    const oldTet2 = parseFloat(formData.scoreTET2);
                    if (isNaN(oldTet2) || oldTet2 < 90) {
                      newCat = 'UR';
                    }
                  }
                }
                
                setFormData({ ...formData, scoreTET2: val, category: newCat }); 
                if (newCat !== formData.category) onCategoryChange(newCat);
                setSubmittedResult(null); 
              }}
              placeholder="e.g. 110"
              className="w-full px-4 py-2 rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">Category</label>
          <div className="flex gap-4">
            {(['UR', 'SC', 'ST'] as Category[]).map(cat => {
              const tet2 = parseFloat(formData.scoreTET2);
              const isTet2Valid = !isNaN(tet2);
              let isDisabled = false;
              
              if (isTet2Valid) {
                if (tet2 < 90 && cat === 'UR') isDisabled = true;
              }

              return (
                <label key={cat} className={`flex items-center gap-2 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer group'}`}>
                  <input
                    type="radio"
                    name="category"
                    value={cat}
                    checked={formData.category === cat}
                    disabled={isDisabled}
                    onChange={() => { 
                      setFormData({ ...formData, category: cat }); 
                      onCategoryChange(cat);
                      setSubmittedResult(null); 
                    }}
                    className="w-4 h-4 text-emerald-600 border-zinc-300 focus:ring-emerald-500 disabled:opacity-50"
                  />
                  <span className={`text-sm font-medium transition-colors ${isDisabled ? 'text-zinc-400' : 'text-zinc-700 group-hover:text-emerald-600'}`}>{cat}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-4"
      >
        {isSubmitting ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        Calculate & Submit
      </button>

      {submittedResult && (
        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center animate-in fade-in slide-in-from-top-2">
          <h4 className="text-emerald-900 font-bold mb-1">Calculation Successful!</h4>
          <p className="text-emerald-700 font-medium mb-3 text-sm">Candidate: {submittedResult.name}</p>
          
          {submittedResult.scoreTET2 < 90 && (
            <div className="mb-4 inline-block px-3 py-1 bg-red-100 border border-red-200 text-red-700 text-xs font-bold rounded-md uppercase tracking-wider">
              Under Reservation
            </div>
          )}
          
          {submittedResult.scoreTET2 >= 90 && (submittedResult.category === 'SC' || submittedResult.category === 'ST') && (
            <div className="mb-4 inline-block px-3 py-1 bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-md uppercase tracking-wider">
              Recommended against UR
            </div>
          )}

          <div className={`grid gap-3 ${submittedResult.allRank !== null ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
            {submittedResult.allRank !== null && (
              <div className="bg-white/60 p-2 rounded-lg">
                <p className="text-[9px] sm:text-[10px] text-emerald-600 font-bold uppercase tracking-wider">All Rank</p>
                <p className="text-lg sm:text-2xl font-black text-emerald-700">#{submittedResult.allRank}</p>
              </div>
            )}
            <div className="bg-white/60 p-2 rounded-lg">
              <p className="text-[9px] sm:text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Cat. Rank</p>
              <p className="text-lg sm:text-2xl font-black text-emerald-700">#{submittedResult.categoryRank}</p>
            </div>
            <div className="bg-white/60 p-2 rounded-lg">
              <p className="text-[9px] sm:text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Weightage</p>
              <p className="text-lg sm:text-2xl font-black text-emerald-700">{submittedResult.score.toFixed(2)}</p>
            </div>
            <div className="bg-white/60 p-2 rounded-lg">
              <p className="text-[9px] sm:text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Category</p>
              <p className="text-lg sm:text-2xl font-black text-emerald-700">{submittedResult.category}</p>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
