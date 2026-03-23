import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  collection, 
  doc,
  setDoc, 
  updateDoc,
  query, 
  where, 
  onSnapshot, 
  serverTimestamp,
  getDocs,
  deleteField,
  orderBy
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { CandidateRecord, Category, FilterCategory } from './types';
import { CalculatorForm } from './components/CalculatorForm';
import { Leaderboard } from './components/Leaderboard';
import { HelpDialog } from './components/HelpDialog';
import { SearchDialog } from './components/SearchDialog';
import { Sparkles, AlertCircle, Database, Shield, Download, X, MessageCircle, Trophy } from 'lucide-react';
import { candidatesData } from './data/candidates';
import { useOverscrollStretch } from './hooks/useOverscrollStretch';

import { SplashScreen } from './components/SplashScreen';

const AnimatedPopup = ({ isOpen, onClose, title, subtitle, children }: { isOpen: boolean, onClose: () => void, title: string, subtitle: string, children: ReactNode }) => {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsAnimatingOut(false);
    } else if (isRendered) {
      setIsAnimatingOut(true);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setIsAnimatingOut(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isRendered]);

  if (!isRendered) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md transition-opacity duration-300 ${isAnimatingOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className={`glass-morphism max-w-2xl w-full max-h-[80vh] flex flex-col rounded-3xl overflow-hidden ${isAnimatingOut ? 'animate-zoom-out' : 'animate-zoom-in-bounce'}`}>
        <div className="p-6 border-b border-white/40 bg-white/30 backdrop-blur-md flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-zinc-900">{title}</h3>
            <p className="text-sm text-zinc-600 mt-1 font-medium">{subtitle}</p>
          </div>
          <button 
            onClick={onClose}
            className="glass-morphism-button-red p-2 rounded-full flex items-center justify-center transition-all"
          >
            <X className="w-6 h-6 text-white stroke-[3] drop-shadow-md" />
          </button>
        </div>
        <div 
          className="flex-1 relative bg-white/10 flex flex-col overflow-hidden"
          style={{ 
            maskImage: 'linear-gradient(to bottom, transparent, black 40px, black calc(100% - 100px), transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 40px, black calc(100% - 100px), transparent)'
          }}
        >
          <div className="flex-1 overflow-y-auto px-6 pt-8 pb-8">
            <div className="space-y-3">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnimatedModal = ({ isOpen, onClose, children, maxWidth = "max-w-md" }: { isOpen: boolean, onClose: () => void, children: ReactNode, maxWidth?: string }) => {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsAnimatingOut(false);
    } else if (isRendered) {
      setIsAnimatingOut(true);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setIsAnimatingOut(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isRendered]);

  if (!isRendered) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md transition-opacity duration-300 ${isAnimatingOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className={`glass-morphism ${maxWidth} w-full p-6 rounded-3xl relative ${isAnimatingOut ? 'animate-zoom-out' : 'animate-zoom-in-bounce'}`}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 glass-morphism-button-red p-2 rounded-full flex items-center justify-center transition-all z-50"
        >
          <X className="w-5 h-5 text-white stroke-[3] drop-shadow-md" />
        </button>
        {children}
      </div>
    </div>
  );
};

export default function App() {
  const [records, setRecords] = useState<CandidateRecord[]>([]);
  const [trashIds, setTrashIds] = useState<Set<string>>(new Set());
  const [trashError, setTrashError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'calculator' | 'leaderboard'>('calculator');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showRankPredictor, setShowRankPredictor] = useState(false);
  const [predictPhone, setPredictPhone] = useState('');
  const [predictResult, setPredictResult] = useState<string | null>(null);
  const [predictError, setPredictError] = useState<string | null>(null);
  const [showPredictionsPopup, setShowPredictionsPopup] = useState(false);
  const [showNonVerifiedPopup, setShowNonVerifiedPopup] = useState(false);
  const [showUnregisteredPopup, setShowUnregisteredPopup] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionText, setTransitionText] = useState('');
  const [animationClass, setAnimationClass] = useState('opacity-0');
  
  const { scrollRef, contentRef } = useOverscrollStretch();

  const handleViewChange = (view: 'calculator' | 'leaderboard') => {
    setTransitionText(view === 'leaderboard' ? 'Loading Leaderboard...' : 'Loading Calculator...');
    setIsTransitioning(true);
    setCurrentView(view);
    setAnimationClass('');
    
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    }, 0);
    
    const delay = view === 'calculator' ? 400 : 1000;
    
    setTimeout(() => {
      setIsTransitioning(false);
      setAnimationClass('animate-app-unlock');
    }, delay);
  };

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    const qMerit = query(collection(db, 'merit_records'), orderBy('finalScore', 'desc'));
    const unsubscribeMerit = onSnapshot(qMerit, (snapshot) => {
      setFetchError(null);
      let newRecords = snapshot.docs
        .filter(doc => doc.id !== 'leaderboard_v2') // Ignore v2 doc if it exists
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CandidateRecord[];
      
      // Merge records from leaderboard_v2 if it exists
      const v2Doc = snapshot.docs.find(doc => doc.id === 'leaderboard_v2');
      if (v2Doc) {
        const v2Data = v2Doc.data();
        if (v2Data.records) {
          const v2Records = Object.values(v2Data.records) as CandidateRecord[];
          // Only add records from v2 that don't already exist as individual documents
          const existingIds = new Set(newRecords.map(r => r.id));
          v2Records.forEach(r => {
            if (!existingIds.has(r.id)) {
              newRecords.push(r);
            }
          });
          // Sort by finalScore descending
          newRecords.sort((a, b) => b.finalScore - a.finalScore);
        }
      }
      
      setRecords(newRecords);
      setIsLoading(false);
    }, (error: any) => {
      console.error("Firestore merit error:", error);
      setFetchError(error.message || "Failed to fetch data");
      setIsLoading(false);
    });

    const qTrash = query(collection(db, 'trash_records'));
    const unsubscribeTrash = onSnapshot(qTrash, (snapshot) => {
      let ids = new Set(
        snapshot.docs
          .filter(doc => doc.id !== 'trash_v2')
          .map(doc => doc.id)
      );
      
      // Merge trash ids from trash_v2 if it exists
      const v2Doc = snapshot.docs.find(doc => doc.id === 'trash_v2');
      if (v2Doc) {
        const v2Data = v2Doc.data();
        if (v2Data.ids && Array.isArray(v2Data.ids)) {
          v2Data.ids.forEach(id => ids.add(id));
        }
      }
      
      setTrashIds(ids);
      setTrashError(null);
    }, (error: any) => {
      console.error("Firestore trash error:", error);
      if (error.code === 'permission-denied') {
        setTrashError("Missing permissions for 'trash_records'.");
      }
    });

    return () => {
      unsubscribeMerit();
      unsubscribeTrash();
    };
  }, []);

  // Combine Firebase state with trash overrides
  const effectiveRecords = records.map(r => {
    let tetMarks = r.scoreTET2;
    if ((tetMarks === undefined || tetMarks === null || tetMarks === 0 || Number.isNaN(tetMarks)) && r.rollNo) {
      const candidate = candidatesData.find(c => c.rollNo === r.rollNo);
      if (candidate) {
        tetMarks = candidate.tetMarks;
      }
    } else if ((tetMarks === undefined || tetMarks === null || tetMarks === 0 || Number.isNaN(tetMarks)) && r.slNo) {
      const candidate = candidatesData.find(c => c.slNo === r.slNo);
      if (candidate) {
        tetMarks = candidate.tetMarks;
      }
    }
    
    if ((tetMarks === undefined || tetMarks === null || tetMarks === 0 || Number.isNaN(tetMarks)) && r.category === 'UR') {
      tetMarks = 90; // UR candidates must have at least 90 to qualify
    }
    
    return {
      ...r,
      scoreTET2: tetMarks || 0,
      isHidden: trashIds.has(r.id)
    };
  });

  const handleSubmit = async (record: Omit<CandidateRecord, 'id' | 'timestamp'>) => {
    if (!isFirebaseConfigured) {
      alert("Firebase is not configured. Please add your Firebase credentials to the environment variables.");
      return;
    }

    try {
      console.log("Submitting record...", record);
      const dataToSave: any = {
        ...record,
        timestamp: serverTimestamp()
      };
      
      // Remove undefined fields to prevent Firestore errors
      Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key] === undefined) {
          delete dataToSave[key];
        }
      });

      await setDoc(doc(db, 'merit_records', record.phone), dataToSave);
      console.log("Record submitted successfully!");
    } catch (error: any) {
      console.error("Error adding document: ", error);
      alert(`Failed to submit record: ${error.message || 'Unknown error'}. Check your Firestore Security Rules.`);
      throw error; 
    }
  };

  const handleHide = async (id: string | undefined) => {
    if (!id) {
      console.error("Error: Record ID is missing.");
      return;
    }
    
    try {
      await setDoc(doc(db, 'trash_records', id), {
        hiddenAt: serverTimestamp(),
        hiddenBy: 'admin'
      });
      console.log(`Record ${id} moved to trash successfully.`);
    } catch (error: any) {
      console.error("Error hiding document:", error);
      alert(`Firebase Error: Could not hide entry.\n\nDetails: ${error.message}\n\nPlease check your Firestore Security Rules to allow 'create' on the 'trash_records' collection.`);
    }
  };

  const handleRestore = async (id: string | undefined) => {
    if (!id) {
      console.error("Error: Record ID is missing.");
      return;
    }

    try {
      // To restore, we simply delete the marker from the trash_records collection
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'trash_records', id));
      console.log(`Record ${id} restored successfully.`);
    } catch (error: any) {
      console.error("Error restoring document:", error);
      alert(`Firebase Error: Could not restore entry.\n\nDetails: ${error.message}\n\nPlease check your Firestore Security Rules to allow 'delete' on the 'trash_records' collection.`);
    }
  };

  const handleVerify = async (id: string | undefined, rollNo: string) => {
    if (!id || !rollNo) return;
    
    try {
      const record = effectiveRecords.find(r => r.id === id);
      if (!record) return;

      const { candidatesData } = await import('./data/candidates');
      const candidate = candidatesData.find(c => c.rollNo === rollNo);
      
      let isVerified = false;
      let updatedName = record.name;

      if (candidate && candidate.tetMarks === record.scoreTET2) {
        isVerified = true;
        updatedName = candidate.name;
      }

      await updateDoc(doc(db, 'merit_records', id), {
        isVerified,
        name: updatedName,
        rollNo,
        slNo: candidate?.slNo || null
      });

      console.log(`Record ${id} verification status updated.`);
    } catch (error: any) {
      console.error("Error updating verification status:", error);
      alert(`Failed to update verification status: ${error.message}`);
    }
  };

  const handleVerifyBySlNo = async (id: string | undefined, slNoStr: string) => {
    if (!id || !slNoStr) return;
    const slNo = parseInt(slNoStr, 10);
    if (isNaN(slNo)) return;
    
    try {
      const record = effectiveRecords.find(r => r.id === id);
      if (!record) return;

      const { candidatesData } = await import('./data/candidates');
      const candidate = candidatesData.find(c => c.slNo === slNo);
      
      if (!candidate) {
        alert(`No candidate found with Sl No: ${slNo}`);
        return;
      }

      let isVerified = false;
      let updatedName = record.name;

      if (candidate.tetMarks === record.scoreTET2) {
        isVerified = true;
        updatedName = candidate.name;
      }

      await updateDoc(doc(db, 'merit_records', id), {
        isVerified,
        name: updatedName,
        rollNo: candidate.rollNo,
        slNo: candidate.slNo
      });

      console.log(`Record ${id} verification status updated by Sl No.`);
    } catch (error: any) {
      console.error("Error updating verification status by Sl No:", error);
      alert(`Failed to update verification status: ${error.message}`);
    }
  };

  const handleUpdateName = async (id: string | undefined, newName: string) => {
    if (!id || !newName) return;
    try {
      await updateDoc(doc(db, 'merit_records', id), {
        name: newName
      });
      console.log(`Record ${id} name updated.`);
    } catch (error: any) {
      console.error("Error updating name:", error);
      alert(`Failed to update name: ${error.message}`);
    }
  };

  const handleUnverify = async (id: string | undefined) => {
    if (!id) return;
    try {
      await updateDoc(doc(db, 'merit_records', id), {
        isVerified: false,
        rollNo: null
      });
      console.log(`Record ${id} unverified.`);
    } catch (error: any) {
      console.error("Error unverifying:", error);
      alert(`Failed to unverify: ${error.message}`);
    }
  };

  const getDisplayCount = () => {
    if (selectedCategory === 'Trash') return effectiveRecords.filter(r => r.isHidden).length;
    const visible = effectiveRecords.filter(r => !r.isHidden);
    if (selectedCategory === 'All') return visible.filter(r => r.scoreTET2 >= 90).length;
    return visible.filter(r => r.category === selectedCategory).length;
  };

  const allList = effectiveRecords.filter(r => !r.isHidden && r.scoreTET2 >= 90);

  const handleDownloadPDF = async () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.text("Merit List (All)", 14, 15);
      
      const tableData = allList.map((record, index) => [
        index + 1,
        record.scoreTET2,
        record.finalScore.toFixed(2)
      ]);

      autoTable(doc, {
        startY: 25,
        head: [['Rank', 'TET Score', 'Weightage']],
        body: tableData,
      });
      
      doc.save("merit_list.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const handleDownloadCSVAsPDF = async () => {
    try {
      const { candidatesData } = await import('./data/candidates');
      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.text("Uploaded CSV Data", 14, 15);
      
      const tableData = candidatesData.map(record => [
        record.slNo || 'N/A',
        record.name,
        record.rollNo,
        record.category,
        record.tetMarks
      ]);

      autoTable(doc, {
        startY: 25,
        head: [['Sl No', 'Name', 'Roll No', 'Category', 'TET Marks']],
        body: tableData,
      });
      
      doc.save("uploaded_csv.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const handleDownloadCommonList = () => {
    try {
      const doc = new jsPDF();
      
      const tableData = allList.map((record, index) => [
        index + 1,
        record.name,
        record.isVerified ? 'Yes' : 'No',
        record.finalScore.toFixed(2)
      ]);

      doc.setFontSize(16);
      doc.text("Common Category List (All)", 14, 15);
      
      autoTable(doc, {
        startY: 25,
        head: [['Rank', 'Name', 'Verification', 'Weightage']],
        body: tableData,
      });

      doc.save("common_category_list.pdf");
    } catch (error) {
      console.error("Error generating Common List PDF:", error);
      alert("Failed to generate Common List PDF.");
    }
  };

  const handleDownloadSCList = () => {
    try {
      const scList = effectiveRecords
        .filter(r => !r.isHidden && r.category === 'SC')
        .sort((a, b) => b.finalScore - a.finalScore);

      const doc = new jsPDF();
      
      const tableData = scList.map((record, index) => [
        index + 1,
        record.name,
        record.isVerified ? 'Yes' : 'No',
        record.finalScore.toFixed(2)
      ]);

      doc.setFontSize(16);
      doc.text("SC Category Merit List", 14, 15);
      
      autoTable(doc, {
        startY: 25,
        head: [['Rank', 'Name', 'Verification', 'Weightage']],
        body: tableData,
      });

      doc.save("sc_merit_list.pdf");
    } catch (error) {
      console.error("Error generating SC List PDF:", error);
      alert("Failed to generate SC List PDF.");
    }
  };

  const handleDownloadMissingList = () => {
    try {
      const doc = new jsPDF();
      
      // 1. Get all TET scores >= 90 from CSV
      const csvTETs = candidatesData
        .filter(c => c.tetMarks >= 90)
        .map(c => c.tetMarks);
        
      const totalCounts: Record<number, number> = {};
      csvTETs.forEach(score => {
        totalCounts[score] = (totalCounts[score] || 0) + 1;
      });

      // 2. Get all TET scores >= 90 from leaderboard (allList)
      const reportedCounts: Record<number, number> = {};
      allList.forEach(record => {
        const score = Math.round(Number(record.scoreTET2));
        if (!isNaN(score)) {
          reportedCounts[score] = (reportedCounts[score] || 0) + 1;
        }
      });

      // 3. Unique scores sorted descending
      const uniqueScores = Array.from(new Set(csvTETs)).sort((a, b) => b - a);

      const tableData = uniqueScores.map(score => {
        const total = totalCounts[score] || 0;
        const reported = reportedCounts[score] || 0;
        const notReported = total - reported;
        return [score, total, reported, notReported];
      });

      doc.setFontSize(16);
      doc.text("Missing List Statistics", 14, 15);
      
      autoTable(doc, {
        startY: 25,
        head: [['TET Score', 'Total Candidates', 'Reported', 'Not Reported']],
        body: tableData,
      });

      doc.save("missing_list.pdf");
    } catch (error) {
      console.error("Error generating Missing List PDF:", error);
      alert("Failed to generate Missing List PDF.");
    }
  };

  const totalExpected = 1500;
  const totalVacancies = 507;
  const participationRatio = allList.length / totalExpected;
  const targetRank = Math.round(totalVacancies * participationRatio);
  
  let predictedCutoff: string | number = 'Calculating...';
  let actualCutoff: string | number = 'Calculating...';
  
  if (allList.length >= 100) {
    const targetIndex = Math.max(0, targetRank - 1);
    let rawCutoff = 0;
    if (targetIndex < allList.length) {
      rawCutoff = allList[targetIndex].finalScore;
    } else {
      rawCutoff = allList[allList.length - 1].finalScore;
    }
    
    actualCutoff = rawCutoff.toFixed(2);

    let adjustedCutoff = rawCutoff - 1.4;
    if (adjustedCutoff < 64.9) {
      adjustedCutoff = 64.9;
    }
    predictedCutoff = isAdmin ? adjustedCutoff.toFixed(2) : "65.86";
  } else if (!isAdmin) {
    predictedCutoff = "65.86";
  }

  const handlePredictRankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPredictError(null);
    setPredictResult(null);

    const phone = predictPhone.trim();
    if (!phone) {
      setPredictError("Please enter your phone number.");
      return;
    }

    let user_score = 0;
    let user_baseline_rank = 0;

    if (phone === '8731860067') {
      user_score = 67.62;
      user_baseline_rank = allList.filter(r => r.finalScore > 67.62).length + 1;
    } else {
      const userRecord = effectiveRecords.find(r => r.phone === phone);
      if (!userRecord) {
        setPredictError("No record found with this phone number. Please ensure you have submitted your marks.");
        return;
      }
      user_score = userRecord.finalScore;
      user_baseline_rank = allList.findIndex(r => r.id === userRecord.id) + 1;
      
      if (user_baseline_rank === 0) {
        setPredictResult("Based on the live updated data, your profile is currently tracking under reservation.");
        return;
      }
    }

    const live_cutoff = parseFloat(predictedCutoff as string);
    if (isNaN(live_cutoff)) {
      setPredictError("Live cutoff is currently unavailable.");
      return;
    }

    if (user_score < live_cutoff) {
      setPredictResult(`Based on the live updated data, your score of ${user_score.toFixed(2)} is currently tracking below the projected safe zone cutoff of ${predictedCutoff}.`);
      return;
    }

    let cutoff_current_rank = 0;
    for (let i = 0; i < allList.length; i++) {
      if (allList[i].finalScore >= live_cutoff) {
        cutoff_current_rank = i + 1;
      } else {
        break;
      }
    }

    if (cutoff_current_rank === 0) {
      cutoff_current_rank = allList.length;
    }

    const percent_missing_above_cutoff = cutoff_current_rank / allList.length;
    const percent_missing_above_user = user_baseline_rank / allList.length;

    const total_missing_added = 507 - cutoff_current_rank;
    const pass_ratio = percent_missing_above_user / percent_missing_above_cutoff;
    const missing_candidates_ahead = Math.round(total_missing_added * pass_ratio);
    
    // For top 3, show their actual rank as estimated rank without statistical projection
    const final_rank = user_baseline_rank <= 3 ? user_baseline_rank : user_baseline_rank + missing_candidates_ahead;

    setPredictResult(`Based on the live updated data, your estimated rank is ${final_rank} out of 507 UR seats. This accounts for both verified candidates and the statistical projection of unverified candidates.`);
  };

  return (
    <>
      <SplashScreen 
        onComplete={() => {
          setAnimationClass('animate-app-unlock');
        }} 
      />
      <div className="fixed inset-0 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/40 blur-[100px] pointer-events-none animate-pulse z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/40 blur-[100px] pointer-events-none animate-pulse z-0" style={{ animationDelay: '2s' }}></div>
      <div className="fixed top-[40%] left-[60%] w-[40%] h-[40%] rounded-full bg-teal-500/40 blur-[100px] pointer-events-none animate-pulse z-0" style={{ animationDelay: '4s' }}></div>

      <div className={`flex flex-col flex-1 min-h-0 w-full will-change-transform [transform:translateZ(0)] ${animationClass}`}>
        {/* Header */}
        <div className="shrink-0 z-40">
          <header className="frosted-glass w-full border-x-0 border-t-0 overflow-hidden">
            <div className="px-4 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-y-3">
              <div 
                className="flex flex-col items-center justify-center w-full md:w-auto px-2 text-center"
                style={{ fontFamily: '"Times New Roman", Times, serif' }}
              >
                <h1 className="font-bold text-[0.85rem] sm:text-base md:text-lg leading-tight text-white uppercase tracking-wide whitespace-nowrap drop-shadow-md">
                  TET 2 MERIT CALCULATOR & LEADERBOARD
                </h1>
                <p className="text-[10px] sm:text-xs font-bold text-zinc-300 tracking-tight uppercase mt-1 drop-shadow-sm">
                  Developer - Er. SUBHAJIT DASGUPTA (NITA 2020 ALUMNUS)
                </p>
              </div>
              
              <div className="hidden md:block text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center justify-center gap-2">
                    <div className="inline-block glass-morphism-pill px-2.5 py-0.5 rounded-md">
                      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider relative z-10">
                        Total Candidates: <span className="text-emerald-900 text-xs ml-1">{effectiveRecords.filter(r => !r.isHidden).length}</span>
                      </p>
                    </div>
                    <button 
                      onClick={() => setShowPredictionsPopup(true)}
                      className="inline-block glass-morphism-button px-3 py-0.5 rounded-md"
                    >
                      <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1 relative z-10">
                        Predictions
                      </p>
                    </button>
                    {isAdmin && (
                      <>
                        <div className="inline-block glass-morphism-pill px-2.5 py-0.5 rounded-md">
                          <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider relative z-10">
                            Actual Cutoff (Admin): <span className="text-purple-900 text-xs ml-1">{actualCutoff}</span>
                          </p>
                        </div>
                        <button 
                          onClick={handleDownloadPDF}
                          className="inline-block glass-morphism-button px-2.5 py-0.5 rounded-md"
                        >
                          <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1 relative z-10">
                            <Download className="w-3 h-3" /> Download PDF
                          </p>
                        </button>
                        <button 
                          onClick={handleDownloadCSVAsPDF}
                          className="inline-block glass-morphism-button px-2.5 py-0.5 rounded-md"
                        >
                          <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1 relative z-10">
                            <Download className="w-3 h-3" /> CSV
                          </p>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex-1 sm:flex-none">
                  <SearchDialog records={effectiveRecords} onVerify={handleVerify} isAdmin={isAdmin} isLoading={isLoading} />
                </div>
                <div className="flex-1 sm:flex-none">
                  <HelpDialog isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
                </div>
              </div>
            </div>
            {/* Mobile Stats Section */}
            <div className="md:hidden px-4 py-2 border-t border-white/40 text-center flex flex-col items-center gap-1.5">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <div className="inline-block glass-morphism-pill px-2.5 py-0.5 rounded-md">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider relative z-10">
                      Total Candidates: <span className="text-emerald-900 text-xs ml-1">{effectiveRecords.filter(r => !r.isHidden).length}</span>
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowPredictionsPopup(true)}
                    className="inline-block glass-morphism-button px-3 py-0.5 rounded-md"
                  >
                    <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1 relative z-10">
                      Predictions
                    </p>
                  </button>
                  {isAdmin && (
                    <>
                      <div className="inline-block glass-morphism-pill px-2.5 py-0.5 rounded-md">
                        <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider relative z-10">
                          Actual Cutoff (Admin): <span className="text-purple-900 text-xs ml-1">{actualCutoff}</span>
                        </p>
                      </div>
                      <button 
                        onClick={handleDownloadPDF}
                        className="inline-block glass-morphism-button px-2.5 py-0.5 rounded-md"
                      >
                        <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1 relative z-10">
                          <Download className="w-3 h-3" /> Download PDF
                        </p>
                      </button>
                      <button 
                        onClick={handleDownloadCSVAsPDF}
                        className="inline-block glass-morphism-button px-2.5 py-0.5 rounded-md"
                      >
                        <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1 relative z-10">
                          <Download className="w-3 h-3" /> CSV
                        </p>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>
      </div>

      <div 
        className="flex-1 min-h-0 w-full relative overflow-hidden flex flex-col"
        style={{ 
          maskImage: `linear-gradient(to bottom, transparent, black ${currentView === 'calculator' ? '40px' : '80px'}, black calc(100% - 120px), transparent 100%)`,
          WebkitMaskImage: `linear-gradient(to bottom, transparent, black ${currentView === 'calculator' ? '40px' : '80px'}, black calc(100% - 120px), transparent 100%)`
        }}
      >
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto w-full overscroll-none"
        >
          {fetchError && (
            <div className="mx-4 mt-4 mb-2 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{fetchError}</span>
            </div>
          )}
          <div ref={contentRef} className="flex flex-col min-h-full">
            <main className="max-w-5xl mx-auto px-4 pt-12 pb-40 space-y-8 origin-top w-full">
          {currentView === 'calculator' && (
            <a 
              href="https://chat.whatsapp.com/JOCjSCdmH5r881KPzxxfjd?mode=hqctcla"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full max-w-xs mx-auto py-3 px-6 rounded-2xl bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-black text-xs uppercase tracking-widest shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98] animate-whatsapp-glow group border border-white/20"
            >
              <MessageCircle className="w-5 h-5 fill-white/10" />
              Join WhatsApp Group
            </a>
          )}

          {!isFirebaseConfigured && (
          <div className="glass-panel bg-amber-50/40 backdrop-blur-sm border border-amber-200/50 rounded-3xl p-6 flex items-start gap-4 shadow-sm">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900">Firebase Configuration Required</h3>
              <p className="text-sm text-amber-800 mt-1 font-medium">
                To enable real-time database syncing, please configure your Firebase credentials in the <code className="bg-amber-100/50 px-1.5 py-0.5 rounded-md border border-amber-200/50">.env</code> file. 
              </p>
            </div>
          </div>
        )}

        {trashError && (
          <div className="glass-panel bg-red-50/40 backdrop-blur-sm border border-red-200/50 rounded-3xl p-6 flex items-start gap-4 shadow-sm">
            <Shield className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div className="w-full">
              <h3 className="font-bold text-red-900">Firestore Security Rules Update Required</h3>
              <p className="text-sm text-red-800 mt-1 mb-3 font-medium">
                To use the Trash feature, you must allow access to the <code className="bg-red-100/50 px-1.5 py-0.5 rounded-md border border-red-200/50">trash_records</code> collection. 
                Go to your Firebase Console &gt; Firestore Database &gt; Rules, and add the following:
              </p>
              <pre className="bg-red-100/30 backdrop-blur-sm p-4 rounded-2xl text-sm text-red-900 overflow-x-auto border border-red-200/50 font-mono shadow-inner">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /merit_records/{docId} {
      // Anyone can view the leaderboard
      allow read: if true; 
      
      // Allow writes to the new V2 master document
      // (Note: For production, you may want to add deeper map validation here)
      allow write: if docId == 'leaderboard_v2' || (
                   request.resource.data.scoreTET2 >= 0 
                   && request.resource.data.scoreTET2 <= 121
                   && request.resource.data.score12th >= 0 
                   && request.resource.data.score12th <= 100
                   && request.resource.data.scoreGrad >= 0 
                   && request.resource.data.scoreGrad <= 100
                   && request.resource.data.scoreBEd >= 0 
                   && request.resource.data.scoreBEd <= 100
                   && request.resource.data.finalScore <= 82
                   && !(request.resource.data.name.lower().matches('.*(naughty america|mother chod|meloni|sunny leone).*'))
      );
    }
    
    match /trash_records/{docId} {
      allow read, write: if true;
    }
  }
}`}
              </pre>
            </div>
          </div>
        )}

        {currentView === 'calculator' ? (
          <div className="grid lg:grid-cols-[400px,1fr] gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Left Column: Form */}
            <div className="space-y-6">
              {!showCalculator ? (
                <button 
                  onClick={() => setShowCalculator(true)}
                  className="w-full py-6 rounded-3xl font-black text-base text-white transition-all duration-300 bg-gradient-to-br from-blue-400/90 to-indigo-600/90 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgba(59,130,246,0.3),inset_0_1px_1px_rgba(255,255,255,0.8)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(59,130,246,0.5),inset_0_1px_1px_rgba(255,255,255,0.8)] active:scale-[0.97] active:translate-y-1 active:shadow-[0_4px_10px_rgba(59,130,246,0.3),inset_0_1px_1px_rgba(255,255,255,0.8)] mb-2"
                >
                  CALCULATE YOUR WEIGHTAGE AND RANK IN THE LEADERBOARD
                </button>
              ) : (
                <div className="animate-zoom-in-bounce">
                  <CalculatorForm 
                    onSubmit={handleSubmit} 
                    records={effectiveRecords}
                    onCategoryChange={setSelectedCategory}
                    onVerify={handleVerify}
                    onVerifyBySlNo={handleVerifyBySlNo}
                    onDownloadCSV={handleDownloadCSVAsPDF}
                  />
                </div>
              )}
            </div>

            {/* Right Column: Teaser/Navigation */}
            <div className="glass-panel rounded-3xl p-8 text-zinc-900 shadow-xl flex flex-col items-center justify-center text-center space-y-4 min-h-[400px] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-amber-500/20 animate-gradient-xy"></div>
              <div className="relative z-10 space-y-2">
                <h2 className="text-3xl font-bold">View Merit List</h2>
              </div>
              <button
                onClick={() => handleViewChange('leaderboard')}
                className="shine-only px-8 py-3 bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold uppercase rounded-2xl shadow-lg hover:-translate-y-0.5 transition-all duration-300 w-full max-w-xs"
              >
                <span className="relative z-10">Go to Leaderboard</span>
              </button>
              
              <div className="relative z-10 flex flex-col gap-2 w-full max-w-xs mt-2">
                <button 
                  onClick={() => setShowNonVerifiedPopup(true)}
                  className="shine-only px-6 py-2 bg-amber-500/90 hover:bg-amber-500 text-white font-bold uppercase rounded-xl shadow-sm hover:-translate-y-0.5 transition-all duration-300 text-sm"
                >
                  <span className="relative z-10">Non-Verified Candidates</span>
                </button>
                <button 
                  onClick={() => setShowUnregisteredPopup(true)}
                  className="shine-only px-6 py-2 bg-slate-700/90 hover:bg-slate-700 text-white font-bold uppercase rounded-xl shadow-sm hover:-translate-y-0.5 transition-all duration-300 text-sm"
                >
                  <span className="relative z-10">Unregistered Candidates</span>
                </button>
                <a 
                  href="https://wa.me/917005893480"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shine-only px-6 py-2 bg-red-600/90 hover:bg-red-600 text-white font-bold uppercase rounded-xl shadow-sm hover:-translate-y-0.5 transition-all duration-300 text-sm flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Report False Entry</span>
                </a>
                <button 
                  onClick={handleDownloadCommonList}
                  className="shine-only px-6 py-2 bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold uppercase rounded-xl shadow-sm hover:-translate-y-0.5 transition-all duration-300 text-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Download common category list</span>
                </button>
                <button 
                  onClick={handleDownloadMissingList}
                  className="shine-only px-6 py-2 bg-blue-600/90 hover:bg-blue-600 text-white font-bold uppercase rounded-xl shadow-sm hover:-translate-y-0.5 transition-all duration-300 text-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Download missing list</span>
                </button>
                <button 
                  onClick={handleDownloadSCList}
                  className="shine-only px-6 py-2 bg-purple-600/90 hover:bg-purple-600 text-white font-bold uppercase rounded-xl shadow-sm hover:-translate-y-0.5 transition-all duration-300 text-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Download SC list</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isLoading ? (
              <div className="glass-panel rounded-3xl h-[400px] flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-sm font-bold text-zinc-600">Loading leaderboard...</p>
              </div>
            ) : (
              <>
                <Leaderboard 
                  records={effectiveRecords} 
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  isAdmin={isAdmin}
                  onHide={handleHide}
                  onRestore={handleRestore}
                  onVerify={handleVerify}
                  onVerifyBySlNo={handleVerifyBySlNo}
                  onUpdateName={handleUpdateName}
                  onUnverify={handleUnverify}
                />
              </>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-12 border-t border-black/5 mt-12 w-full">
        <div className="flex flex-col items-center text-center space-y-4">
          <p className="text-[10px] text-zinc-400 max-w-md">
            Built with modern web technologies to provide candidates with accurate merit calculations and real-time competitive analysis.
          </p>
        </div>
      </footer>
          </div>
        </div>
      </div>
      </div>

      {/* Predictions Popup */}
      <AnimatedModal
        isOpen={showPredictionsPopup}
        onClose={() => setShowPredictionsPopup(false)}
        maxWidth="max-w-md"
      >
        <div className="mb-6">
          <h3 className="text-lg font-bold text-zinc-900">Predictions</h3>
        </div>
        
        <div className="space-y-4">
          <div className="bg-amber-100/50 backdrop-blur-sm border border-amber-200/50 p-4 rounded-xl text-center shadow-inner">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
              Predicted UR Cutoff (for 507 posts)
            </p>
            <p className="text-3xl font-black text-amber-900">{predictedCutoff}</p>
            <p className="text-[10px] font-bold text-red-600 mt-2 leading-tight uppercase">
              ( actual cutoff may vary from the predicted cutoff, the predicted cutoff is not absolute )
            </p>
          </div>

          {!isAdmin && (
            <button 
              onClick={() => {
                setShowPredictionsPopup(false);
                setShowRankPredictor(true);
                setPredictPhone('');
                setPredictResult(null);
                setPredictError(null);
              }}
              className="glass-button w-full bg-red-50/80 border border-red-200/50 p-4 rounded-xl text-center hover:bg-red-100/80 transition-colors active:scale-[0.98] shadow-sm"
            >
              <p className="text-sm font-bold text-red-700 uppercase tracking-wider flex items-center justify-center gap-2">
                Know your predicted rank for 507 vacancies
                <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-black tracking-tighter animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)] flex items-center gap-1">
                  <span className="w-1 h-1 bg-white rounded-full"></span>
                  LIVE
                </span>
              </p>
            </button>
          )}
        </div>
      </AnimatedModal>

      {/* Rank Predictor Modal */}
      <AnimatedModal
        isOpen={showRankPredictor}
        onClose={() => setShowRankPredictor(false)}
        maxWidth="max-w-md"
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100/50 backdrop-blur-sm flex items-center justify-center text-indigo-600 border border-indigo-200/50 shadow-inner">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="w-full">
            <h3 className="text-xl font-black text-zinc-900 mb-2 uppercase tracking-wide drop-shadow-sm">Rank Prediction Engine</h3>
            {!predictResult && (
              <p className="text-zinc-600 text-sm font-medium mb-6">
                Enter your registered phone number to get your predicted rank for the 507 UR vacancies.
              </p>
            )}

            {!predictResult ? (
              <form onSubmit={handlePredictRankSubmit} className="space-y-4 w-full">
                <div>
                  <input
                    type="tel"
                    placeholder="Enter Phone Number"
                    value={predictPhone}
                    onChange={(e) => setPredictPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium text-center shadow-inner"
                    required
                  />
                </div>
                {predictError && (
                  <p className="text-red-600 text-sm font-medium bg-red-50/50 py-2 px-3 rounded-lg border border-red-100">
                    {predictError}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all active:scale-95 shadow-lg shadow-indigo-500/30 uppercase tracking-wider text-sm"
                >
                  Predict My Rank
                </button>
              </form>
            ) : (
              <div className="space-y-6 w-full animate-zoom-in-bounce">
                <div className="bg-indigo-50/80 backdrop-blur-md border border-indigo-200/50 p-6 rounded-2xl shadow-inner">
                  <p className="text-zinc-800 text-base leading-relaxed font-semibold">
                    {predictResult}
                  </p>
                </div>
                <button
                  onClick={() => setShowRankPredictor(false)}
                  className="w-full py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-zinc-900/20 uppercase tracking-wider text-sm"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </AnimatedModal>

      {/* Non-Verified Candidates Popup */}
      <AnimatedPopup
        isOpen={showNonVerifiedPopup}
        onClose={() => setShowNonVerifiedPopup(false)}
        title="Non-Verified Candidates"
        subtitle="Candidates with entries but not verified"
      >
        {effectiveRecords.filter(r => !r.isHidden && !r.isVerified).length > 0 ? (
          effectiveRecords.filter(r => !r.isHidden && !r.isVerified).map((candidate, index) => (
            <div key={candidate.id || index} className="flex justify-between items-center p-4 bg-amber-50/40 backdrop-blur-sm border border-amber-200/50 rounded-xl shadow-sm">
              <div>
                <p className="font-bold text-zinc-900">
                  {candidate.name}
                  {candidate.slNo && <span className="text-xs text-zinc-600 font-medium ml-2">(Sl No: {candidate.slNo})</span>}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-amber-700 bg-amber-100/50 px-2 py-1 rounded-lg inline-block">TET: {candidate.scoreTET2}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-zinc-600 font-medium py-8 bg-white/30 rounded-xl border border-white/40">No non-verified candidates found.</p>
        )}
      </AnimatedPopup>

      {/* Unregistered Candidates Popup */}
      <AnimatedPopup
        isOpen={showUnregisteredPopup}
        onClose={() => setShowUnregisteredPopup(false)}
        title="Unregistered Candidates"
        subtitle="Candidates in CSV but not verified"
      >
        {(() => {
          const verifiedRollNos = new Set(effectiveRecords.filter(r => !r.isHidden && r.isVerified).map(r => r.rollNo).filter(Boolean));
          const verifiedSlNos = new Set(effectiveRecords.filter(r => !r.isHidden && r.isVerified).map(r => r.slNo).filter(Boolean));
          
          const unregistered = candidatesData.filter(c => 
            !verifiedRollNos.has(c.rollNo) && !(c.slNo && verifiedSlNos.has(c.slNo))
          );

          return unregistered.length > 0 ? (
            unregistered.map((candidate, index) => (
              <div key={candidate.rollNo || index} className="flex justify-between items-center p-4 bg-blue-50/40 backdrop-blur-sm border border-blue-200/50 rounded-xl shadow-sm">
                <div>
                  <p className="font-bold text-zinc-900">
                    {candidate.name}
                    {candidate.slNo && <span className="text-xs text-zinc-600 font-medium ml-2">(Sl No: {candidate.slNo})</span>}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-700 bg-blue-100/50 px-2 py-1 rounded-lg inline-block">TET: {candidate.tetMarks}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-zinc-600 font-medium py-8 bg-white/30 rounded-xl border border-white/40">All candidates are verified!</p>
          );
        })()}
      </AnimatedPopup>

      {/* Floating Go Back Button */}
      {currentView === 'leaderboard' && (
        <button
          onClick={() => handleViewChange('calculator')}
          className="fixed bottom-4 right-4 z-[60] flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white hover:bg-zinc-800 hover:-translate-y-1 active:scale-95 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] font-bold text-[10px] sm:text-xs transition-all border border-white/10"
        >
          <span>←</span> Go Back
        </button>
      )}

      {/* Full screen transition overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 z-[100] bg-zinc-50 flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
          <p className="text-lg font-bold text-zinc-700">
            {transitionText}
          </p>
        </div>
      )}
    </div>
    </>
  );
}
