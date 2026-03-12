import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Category, CandidateRecord, Gender, FilterCategory } from '../types';
import { Calculator, Send, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { candidatesData } from '../data/candidates';

interface CalculatorFormProps {
  onSubmit: (record: Omit<CandidateRecord, 'id' | 'timestamp'>) => Promise<void>;
  records: CandidateRecord[];
  onCategoryChange: (category: FilterCategory) => void;
  onVerify?: (id: string, rollNo: string) => void;
  onVerifyBySlNo?: (id: string, slNo: string) => void;
}

export const CalculatorForm: React.FC<CalculatorFormProps> = ({ onSubmit, records, onCategoryChange, onVerify, onVerifyBySlNo }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{name: string, allRank: number | null, categoryRank: number, score: number, category: string, scoreTET2: number} | null>(null);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [duplicateRecord, setDuplicateRecord] = useState<CandidateRecord | null>(null);
  const [verifyInput, setVerifyInput] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    slNo: '',
    rollNo: '',
    phone: '',
    gender: 'Male' as Gender,
    score12th: '',
    scoreGrad: '',
    scoreBEd: '',
    scoreTET2: '',
    category: 'UR' as Category
  });

  // Auto-fill logic based on Sl No
  useEffect(() => {
    if (formData.slNo) {
      const sl = parseInt(formData.slNo, 10);
      if (!isNaN(sl)) {
        const candidate = candidatesData.find(c => c.slNo === sl);
        if (candidate) {
          const parts = candidate.name.split(' ');
          let first = parts[0] || '';
          let last = parts.length > 1 ? parts[parts.length - 1] : '';
          let middle = parts.length > 2 ? parts.slice(1, -1).join(' ') : '';
          
          setFormData(prev => {
            if (prev.rollNo === candidate.rollNo) return prev;
            return {
              ...prev,
              rollNo: candidate.rollNo,
              firstName: first,
              middleName: middle,
              lastName: last,
              category: candidate.category,
              scoreTET2: candidate.tetMarks.toString()
            };
          });
        }
      }
    }
  }, [formData.slNo]);

  // Auto-fill logic based on Roll No
  useEffect(() => {
    if (formData.rollNo && formData.rollNo.length >= 4) {
      const candidate = candidatesData.find(c => c.rollNo === formData.rollNo);
      if (candidate) {
        const parts = candidate.name.split(' ');
        let first = parts[0] || '';
        let last = parts.length > 1 ? parts[parts.length - 1] : '';
        let middle = parts.length > 2 ? parts.slice(1, -1).join(' ') : '';
        
        setFormData(prev => {
          if (prev.slNo === (candidate.slNo ? candidate.slNo.toString() : '')) return prev;
          return {
            ...prev,
            slNo: candidate.slNo ? candidate.slNo.toString() : '',
            firstName: first,
            middleName: middle,
            lastName: last,
            category: candidate.category,
            scoreTET2: candidate.tetMarks.toString()
          };
        });
      }
    }
  }, [formData.rollNo]);

  // Auto-fill logic based on Name
  useEffect(() => {
    const fullName = [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(' ').toUpperCase();
    if (fullName.length > 3 && !formData.rollNo) {
      const candidate = candidatesData.find(c => c.name.toUpperCase() === fullName);
      if (candidate) {
        setFormData(prev => ({
          ...prev,
          slNo: candidate.slNo ? candidate.slNo.toString() : '',
          rollNo: candidate.rollNo,
          category: candidate.category,
          scoreTET2: candidate.tetMarks.toString()
        }));
      }
    }
  }, [formData.firstName, formData.middleName, formData.lastName]);

  const calculateMerit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicateRecord(null);
    setVerifyInput('');
    
    if (formData.phone.length !== 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    const fullName = [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(' ').toUpperCase();
    if (!fullName) {
      alert("Please enter candidate name.");
      return;
    }

    if (!formData.scoreTET2 || !formData.category) {
      alert("Candidate data not found. Please check your Name or Roll No.");
      return;
    }

    setIsSubmitting(true);

    try {
      const p12 = parseFloat(formData.score12th) || 0;
      const pGrad = parseFloat(formData.scoreGrad) || 0;
      const pBEd = parseFloat(formData.scoreBEd) || 0;
      const tetMarks = parseFloat(formData.scoreTET2) || 0;

      const tetPercentage = (tetMarks / 150) * 100;
      const finalScore = parseFloat(((p12 * 0.12) + (pGrad * 0.03) + (pBEd * 0.15) + (tetPercentage * 0.70)).toFixed(2));

      const visibleRecords = records.filter(r => !r.isHidden);
      
      // Check if phone number already has a verified record
      const existingByPhone = visibleRecords.find(r => r.phone === formData.phone);
      if (existingByPhone && existingByPhone.isVerified) {
        setDuplicateRecord(existingByPhone);
        setIsSubmitting(false);
        return;
      }

      // Check if roll no is already registered in another record
      if (formData.rollNo) {
        const existingByRollNo = visibleRecords.find(r => r.rollNo === formData.rollNo && r.phone !== formData.phone);
        if (existingByRollNo) {
          setDuplicateRecord(existingByRollNo);
          setIsSubmitting(false);
          return;
        }
      }

      // Check if sl no is already registered in another record
      if (formData.slNo) {
        const sl = parseInt(formData.slNo, 10);
        if (!isNaN(sl)) {
          const existingBySlNo = visibleRecords.find(r => r.slNo === sl && r.phone !== formData.phone);
          if (existingBySlNo) {
            setDuplicateRecord(existingBySlNo);
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Check for duplicate entry by scores (only for non-verified candidates)
      const isVerifiedSubmission = (formData.rollNo && candidatesData.some(c => c.rollNo === formData.rollNo && c.tetMarks === tetMarks));
      
      if (!isVerifiedSubmission) {
        const duplicate = visibleRecords.find(r => 
          r.score12th === p12 && 
          r.scoreGrad === pGrad && 
          r.scoreBEd === pBEd && 
          r.finalScore === finalScore &&
          r.phone !== formData.phone
        );

        if (duplicate) {
          setDuplicateRecord(duplicate);
          setIsSubmitting(false);
          return;
        }
      }

      const allRank = tetMarks >= 90 
        ? visibleRecords.filter(r => r.scoreTET2 >= 90 && r.finalScore > finalScore).length + 1 
        : null;
      const categoryRank = visibleRecords.filter(r => r.category === formData.category && r.finalScore > finalScore).length + 1;

      await onSubmit({
        name: fullName,
        phone: formData.phone,
        gender: formData.gender,
        category: formData.category,
        score12th: p12,
        scoreGrad: pGrad,
        scoreBEd: pBEd,
        scoreTET2: tetMarks,
        finalScore: finalScore,
        rollNo: formData.rollNo || undefined,
        slNo: formData.slNo ? parseInt(formData.slNo, 10) : undefined,
        isVerified: formData.rollNo ? candidatesData.some(c => c.rollNo === formData.rollNo && c.tetMarks === tetMarks) : false
      });
      
      setSubmittedResult({
        name: fullName,
        allRank,
        categoryRank,
        score: finalScore,
        category: formData.category,
        scoreTET2: tetMarks
      });

      // Dismiss keyboard for better visibility of the popup
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      setShowResultPopup(true);
      setIsConnecting(true);

      setTimeout(() => {
        setIsConnecting(false);
      }, 3500);

      // Reset form
      setFormData(prev => ({
        ...prev,
        firstName: '',
        middleName: '',
        lastName: '',
        slNo: '',
        rollNo: '',
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

  const getDuplicateRanks = (record: CandidateRecord) => {
    const visibleRecords = records.filter(r => !r.isHidden);
    const allRank = record.scoreTET2 >= 90 
      ? visibleRecords.filter(r => r.scoreTET2 >= 90 && r.finalScore > record.finalScore).length + 1 
      : null;
    const categoryRank = visibleRecords.filter(r => r.category === record.category && r.finalScore > record.finalScore).length + 1;
    return { allRank, categoryRank };
  };

  return (
    <form onSubmit={calculateMerit} className="glass-panel p-6 rounded-3xl space-y-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400"></div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-100/50 backdrop-blur-sm flex items-center justify-center text-emerald-600">
          <Calculator className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900">Merit Calculator</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-1">
            Sl No <span className="text-[10px] text-red-500 font-normal normal-case">(NO.F.4 (1-11)/COE/TRBT/2020/477(26/06/25)- list of qualified candidates)</span>
          </label>
          <input
            type="number"
            value={formData.slNo}
            onChange={e => { setFormData({ ...formData, slNo: e.target.value }); setSubmittedResult(null); }}
            placeholder="Enter Sl No"
            className="glass-input w-full px-4 py-3 rounded-xl text-zinc-900 placeholder:text-zinc-400"
          />
        </div>

        <div className="flex items-center justify-center relative !-my-1 z-10">
          <div className="absolute w-full h-px bg-red-200/50"></div>
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest bg-red-50/80 backdrop-blur-md px-4 py-1 rounded-full relative z-10 border border-red-200 shadow-sm">OR</span>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-1">TET 2 Roll No</label>
          <input
            type="text"
            value={formData.rollNo}
            onChange={e => { setFormData({ ...formData, rollNo: e.target.value }); setSubmittedResult(null); }}
            placeholder="Enter Roll No"
            className="glass-input w-full px-4 py-3 rounded-xl text-zinc-900 placeholder:text-zinc-400"
          />
        </div>

        <div className="flex items-center justify-center relative !-my-1 z-10">
          <div className="absolute w-full h-px bg-red-200/50"></div>
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest bg-red-50/80 backdrop-blur-md px-4 py-1 rounded-full relative z-10 border border-red-200 shadow-sm">OR</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-1">First Name</label>
            <input
              required
              type="text"
              value={formData.firstName}
              onChange={e => { setFormData({ ...formData, firstName: e.target.value.toUpperCase() }); setSubmittedResult(null); }}
              placeholder="FIRST"
              className="glass-input w-full px-4 py-3 rounded-xl text-zinc-900 placeholder:text-zinc-400 uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-1">Middle Name</label>
            <input
              type="text"
              value={formData.middleName}
              onChange={e => { setFormData({ ...formData, middleName: e.target.value.toUpperCase() }); setSubmittedResult(null); }}
              placeholder="MIDDLE"
              className="glass-input w-full px-4 py-3 rounded-xl text-zinc-900 placeholder:text-zinc-400 uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-1">Last Name</label>
            <input
              required
              type="text"
              value={formData.lastName}
              onChange={e => { setFormData({ ...formData, lastName: e.target.value.toUpperCase() }); setSubmittedResult(null); }}
              placeholder="LAST"
              className="glass-input w-full px-4 py-3 rounded-xl text-zinc-900 placeholder:text-zinc-400 uppercase"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">Gender</label>
          <div className="glass-input flex gap-6 px-4 py-3 rounded-xl w-full">
            {(['Male', 'Female'] as Gender[]).map(g => (
              <label key={g} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="gender"
                  value={g}
                  checked={formData.gender === g}
                  onChange={() => { setFormData({ ...formData, gender: g }); setSubmittedResult(null); }}
                  className="w-4 h-4 text-emerald-600 border-zinc-300 focus:ring-emerald-500 bg-white/50"
                />
                <span className="text-sm font-medium text-zinc-700 group-hover:text-emerald-700 transition-colors">{g}</span>
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
            className="glass-input w-full px-4 py-3 rounded-xl text-zinc-900 placeholder:text-zinc-400"
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
              className="glass-input w-full px-4 py-3 rounded-xl text-zinc-900 placeholder:text-zinc-400"
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
              className="glass-input w-full px-4 py-3 rounded-xl text-zinc-900 placeholder:text-zinc-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-1">B.Ed / D.El.Ed %</label>
            <input
              required
              type="number"
              step="0.01"
              value={formData.scoreBEd}
              onChange={e => { setFormData({ ...formData, scoreBEd: e.target.value }); setSubmittedResult(null); }}
              placeholder="e.g. 80.0"
              className="glass-input w-full px-4 py-3 rounded-xl text-zinc-900 placeholder:text-zinc-400"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="glass-button w-full bg-emerald-600/90 hover:bg-emerald-600 disabled:bg-emerald-400/50 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-6"
      >
        {isSubmitting ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        Calculate & Submit
      </button>

      {showResultPopup && submittedResult && createPortal(
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in slide-in-from-bottom duration-500">
          <div 
            className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center max-w-2xl mx-auto w-full"
          >
            {isConnecting ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-6">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-3 border-4 border-emerald-200 rounded-full border-b-transparent animate-spin-reverse"></div>
                </div>
                <div className="space-y-2 text-center">
                  <p className="text-zinc-900 font-black text-xl animate-pulse">Connecting to TRBT server</p>
                  <p className="text-zinc-500 font-bold text-base">Fetching and verifying data...</p>
                </div>
              </div>
            ) : (
              <div className="w-full space-y-4 py-4">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl text-zinc-900 font-black tracking-tight">Calculation Successful!</h4>
                  <p className="text-lg text-emerald-700 font-bold">{submittedResult.name}</p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-2">
                  <div className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm">
                    {submittedResult.category}
                  </div>
                  
                  {submittedResult.scoreTET2 < 90 && (
                    <div className="px-3 py-1 bg-red-50 border border-red-100 text-red-700 text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm">
                      Under Reservation
                    </div>
                  )}
                  
                  {submittedResult.scoreTET2 >= 90 && (submittedResult.category === 'SC' || submittedResult.category === 'ST' || submittedResult.category === 'PH') && (
                    <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm">
                      Recommended against UR
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {submittedResult.allRank !== null && (
                    <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">All Rank</p>
                      <p className="text-2xl font-black text-zinc-900">#{submittedResult.allRank}</p>
                    </div>
                  )}
                  <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Category Rank</p>
                    <p className="text-2xl font-black text-zinc-900">#{submittedResult.categoryRank}</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider mb-1">Weightage</p>
                    <p className="text-2xl font-black text-emerald-900">{submittedResult.score.toFixed(2)}</p>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">TET Score</p>
                    <p className="text-2xl font-black text-zinc-900">{submittedResult.scoreTET2}</p>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center col-span-2">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Category</p>
                    <p className="text-xl font-black text-zinc-900">{submittedResult.category}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-white border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setShowResultPopup(false)}
              className="w-full max-w-2xl mx-auto block bg-zinc-900 hover:bg-zinc-800 text-white font-black py-3.5 rounded-xl transition-all active:scale-[0.98] text-center shadow-lg"
            >
              Go Back
            </button>
          </div>
        </div>,
        document.body
      )}

      {duplicateRecord && createPortal(
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in slide-in-from-bottom duration-500">
          <div 
            className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center max-w-2xl mx-auto w-full"
          >
            <div className="w-full space-y-4 py-4">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-zinc-900 tracking-tight">
                  {duplicateRecord.isVerified ? 'Verified data already exists!' : 'You are already registered!'}
                </h3>
                <p className="text-xs text-zinc-600 font-medium max-w-md mx-auto leading-relaxed">
                  {duplicateRecord.isVerified 
                    ? 'A verified entry with these details is already on the leaderboard. We cannot save duplicate or overwritten data for verified candidates.'
                    : 'We found an existing entry with the same academic scores.'}
                </p>
              </div>
              
              <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 space-y-4 shadow-sm">
                <div className="space-y-3">
                  <div className="flex flex-col items-center border-b border-zinc-200 pb-3 text-center">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Name</span>
                    <span className="text-xl font-black text-zinc-900 flex items-center gap-2">
                      {duplicateRecord.name}
                      {duplicateRecord.isVerified === true && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                      {duplicateRecord.isVerified === false && <XCircle className="w-5 h-5 text-red-500" />}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Category</span>
                    <span className="text-lg font-black text-zinc-900">{duplicateRecord.category}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Weightage</span>
                    <span className="text-xl font-black text-emerald-600">{duplicateRecord.finalScore.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {getDuplicateRanks(duplicateRecord).allRank !== null && (
                    <div className="bg-white p-3 rounded-xl text-center border border-zinc-200 shadow-sm">
                      <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">All Rank</span>
                      <span className="text-xl font-black text-zinc-900">#{getDuplicateRanks(duplicateRecord).allRank}</span>
                    </div>
                  )}
                  <div className="bg-white p-3 rounded-xl text-center border border-zinc-200 shadow-sm">
                    <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Category Rank</span>
                    <span className="text-xl font-black text-zinc-900">#{getDuplicateRanks(duplicateRecord).categoryRank}</span>
                  </div>
                </div>
              </div>

              {duplicateRecord.isVerified !== true && (onVerify || onVerifyBySlNo) && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest text-center">Verify Your Entry</h4>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Enter Roll No or Sl No"
                      value={verifyInput}
                      onChange={(e) => setVerifyInput(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-zinc-100 focus:border-emerald-500 focus:outline-none text-base font-bold transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = verifyInput.trim();
                        if (input && duplicateRecord.id) {
                          if (input.length > 5 && onVerify) {
                            onVerify(duplicateRecord.id, input);
                          } else if (input.length <= 5 && onVerifyBySlNo) {
                            onVerifyBySlNo(duplicateRecord.id, input);
                          }
                          setDuplicateRecord(null);
                        }
                      }}
                      className={`w-full ${duplicateRecord.isVerified === false ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white py-3.5 rounded-xl text-base font-black transition-all shadow-lg ${duplicateRecord.isVerified === false ? 'shadow-amber-500/20' : 'shadow-emerald-500/20'}`}
                    >
                      {duplicateRecord.isVerified === false ? 'Reverify Now' : 'Verify Now'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 bg-white border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setDuplicateRecord(null)}
              className="w-full max-w-2xl mx-auto block bg-zinc-900 hover:bg-zinc-800 text-white font-black py-3.5 rounded-xl transition-all active:scale-[0.98] text-center shadow-lg"
            >
              Go Back
            </button>
          </div>
        </div>,
        document.body
      )}
    </form>
  );
};

