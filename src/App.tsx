import { useState, useEffect, useRef } from 'react';
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
  serverTimestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { CandidateRecord, Category, FilterCategory } from './types';
import { CalculatorForm } from './components/CalculatorForm';
import { Leaderboard } from './components/Leaderboard';
import { HelpDialog } from './components/HelpDialog';
import { SearchDialog } from './components/SearchDialog';
import { Sparkles, AlertCircle, Database, Shield, Download, X } from 'lucide-react';
import { candidatesData } from './data/candidates';

export default function App() {
  const [records, setRecords] = useState<CandidateRecord[]>([]);
  const [trashIds, setTrashIds] = useState<Set<string>>(new Set());
  const [trashError, setTrashError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'calculator' | 'leaderboard'>('calculator');
  const [isAdmin, setIsAdmin] = useState(false);
  const [predictRankMessage, setPredictRankMessage] = useState<string | null>(null);
  const [showPredictionsPopup, setShowPredictionsPopup] = useState(false);
  const [showNonVerifiedPopup, setShowNonVerifiedPopup] = useState(false);
  const [showUnregisteredPopup, setShowUnregisteredPopup] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionText, setTransitionText] = useState('');
  const mainRef = useRef<HTMLElement>(null);

  const handleViewChange = (view: 'calculator' | 'leaderboard') => {
    setTransitionText(view === 'leaderboard' ? 'Loading Leaderboard...' : 'Loading Calculator...');
    setIsTransitioning(true);
    setCurrentView(view);
    
    setTimeout(() => {
      mainRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    }, 0);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 1000);
  };

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    // Fetch ALL merit records
    const qMerit = query(collection(db, 'merit_records'));
    // Fetch ALL trash records (hidden IDs)
    const qTrash = query(collection(db, 'trash_records'));

    const unsubscribeMerit = onSnapshot(qMerit, (snapshot) => {
      const newRecords = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as CandidateRecord))
        .filter(record => typeof record.finalScore === 'number');
      
      // Sort client-side: Highest score first
      newRecords.sort((a, b) => b.finalScore - a.finalScore);
      
      setRecords(newRecords);
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore merit error:", error);
      setIsLoading(false);
    });

    const unsubscribeTrash = onSnapshot(qTrash, (snapshot) => {
      const ids = new Set(snapshot.docs.map(doc => doc.id));
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
  const effectiveRecords = records.map(r => ({
    ...r,
    isHidden: trashIds.has(r.id)
  }));

  const handleSubmit = async (record: Omit<CandidateRecord, 'id' | 'timestamp'>) => {
    if (!isFirebaseConfigured) {
      alert("Firebase is not configured. Please add your Firebase credentials to the environment variables.");
      return;
    }

    try {
      console.log("Submitting record...", record);
      await setDoc(doc(db, 'merit_records', record.phone), {
        ...record,
        timestamp: serverTimestamp()
      });
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
      // Instead of updating the record, we create a marker in the trash_records collection
      // This is more robust if the user's rules block updates but allow creates
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
      // We use the delete_doc equivalent in the SDK
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
        rollNo
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
        rollNo: candidate.rollNo
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
        reportedCounts[record.scoreTET2] = (reportedCounts[record.scoreTET2] || 0) + 1;
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
    predictedCutoff = isAdmin ? adjustedCutoff.toFixed(2) : "65.85";
  } else if (!isAdmin) {
    predictedCutoff = "65.85";
  }

  const handlePredictRankClick = () => {
    const remaining = 700 - allList.length;
    setPredictRankMessage(`To predict your rank, add ${remaining} more who got 90 or above.`);
  };

  return (
    <div className="h-screen h-[100dvh] flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/40 blur-[100px] pointer-events-none animate-pulse z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/40 blur-[100px] pointer-events-none animate-pulse z-0" style={{ animationDelay: '2s' }}></div>
      <div className="fixed top-[40%] left-[60%] w-[40%] h-[40%] rounded-full bg-teal-500/40 blur-[100px] pointer-events-none animate-pulse z-0" style={{ animationDelay: '4s' }}></div>

      {/* Header */}
      <header className="glass-panel border-b border-white/40 shrink-0 z-40 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-emerald-500/20 border border-emerald-600/20 shrink-0 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-700">
              <span className="text-white font-black text-sm tracking-tighter">TTET</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-1.5">
              <h1 className="font-bold text-sm sm:text-base leading-tight text-zinc-900">TET 2 Merit</h1>
              <h2 className="font-bold text-sm sm:text-base leading-tight text-zinc-900">Calculator & Leaderboard</h2>
            </div>
          </div>
          
          <div className="hidden md:block text-center">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">Developer -</p>
            <p className="text-sm font-bold text-zinc-900 tracking-tight uppercase">
              Er. SUBHAJIT DASGUPTA
            </p>
            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mb-1.5">
              NITA 2020 ALUMNUS
            </p>
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex items-center justify-center gap-2">
                <div className="inline-block bg-white/50 backdrop-blur-sm border border-emerald-200/50 px-2.5 py-0.5 rounded-md shadow-sm">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                    Total Candidates: <span className="text-emerald-900 text-xs ml-1">{effectiveRecords.filter(r => !r.isHidden).length}</span>
                  </p>
                </div>
                <button 
                  onClick={() => setShowPredictionsPopup(true)}
                  className="inline-block bg-white/50 backdrop-blur-sm border border-red-200/50 px-3 py-0.5 rounded-md shadow-sm hover:bg-white/80 transition-colors active:scale-95"
                >
                  <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1">
                    Predictions
                  </p>
                </button>
                {isAdmin && (
                  <>
                    <div className="inline-block bg-white/50 backdrop-blur-sm border border-purple-200/50 px-2.5 py-0.5 rounded-md shadow-sm">
                      <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                        Actual Cutoff (Admin): <span className="text-purple-900 text-xs ml-1">{actualCutoff}</span>
                      </p>
                    </div>
                    <button 
                      onClick={handleDownloadPDF}
                      className="inline-block bg-white/50 backdrop-blur-sm border border-blue-200/50 px-2.5 py-0.5 rounded-md shadow-sm hover:bg-white/80 transition-colors active:scale-95"
                    >
                      <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                        <Download className="w-3 h-3" /> Download PDF
                      </p>
                    </button>
                    <button 
                      onClick={handleDownloadCSVAsPDF}
                      className="inline-block bg-white/50 backdrop-blur-sm border border-indigo-200/50 px-2.5 py-0.5 rounded-md shadow-sm hover:bg-white/80 transition-colors active:scale-95"
                    >
                      <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
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
              <SearchDialog records={effectiveRecords} onVerify={handleVerify} />
            </div>
            <div className="flex-1 sm:flex-none">
              <HelpDialog isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
            </div>
          </div>
        </div>
        {/* Mobile Dev Name */}
        <div className="md:hidden px-4 py-2 border-t border-white/20 text-center bg-white/30 backdrop-blur-md flex flex-col items-center gap-1.5">
          <p className="text-[10px] font-bold text-zinc-900 tracking-tight uppercase">
            Developer - Er. SUBHAJIT DASGUPTA (NITA 2020 ALUMNUS)
          </p>
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="inline-block bg-white/50 backdrop-blur-sm border border-emerald-200/50 px-2.5 py-0.5 rounded-md shadow-sm">
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Total Candidates: <span className="text-emerald-900 text-xs ml-1">{effectiveRecords.filter(r => !r.isHidden).length}</span>
                </p>
              </div>
              <button 
                onClick={() => setShowPredictionsPopup(true)}
                className="inline-block bg-white/50 backdrop-blur-sm border border-red-200/50 px-3 py-0.5 rounded-md shadow-sm hover:bg-white/80 transition-colors active:scale-95"
              >
                <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1">
                  Predictions
                </p>
              </button>
              {isAdmin && (
                <>
                  <div className="inline-block bg-white/50 backdrop-blur-sm border border-purple-200/50 px-2.5 py-0.5 rounded-md shadow-sm">
                    <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                      Actual Cutoff (Admin): <span className="text-purple-900 text-xs ml-1">{actualCutoff}</span>
                    </p>
                  </div>
                  <button 
                    onClick={handleDownloadPDF}
                    className="inline-block bg-white/50 backdrop-blur-sm border border-blue-200/50 px-2.5 py-0.5 rounded-md shadow-sm hover:bg-white/80 transition-colors active:scale-95"
                  >
                    <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                      <Download className="w-3 h-3" /> Download PDF
                    </p>
                  </button>
                  <button 
                    onClick={handleDownloadCSVAsPDF}
                    className="inline-block bg-white/50 backdrop-blur-sm border border-indigo-200/50 px-2.5 py-0.5 rounded-md shadow-sm hover:bg-white/80 transition-colors active:scale-95"
                  >
                    <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                      <Download className="w-3 h-3" /> CSV
                    </p>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div 
        ref={mainRef}
        className="flex-1 overflow-y-auto w-full scroll-smooth"
        style={{ 
          maskImage: 'linear-gradient(to bottom, transparent, black 80px, black calc(100% - 300px), transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 80px, black calc(100% - 300px), transparent 100%)'
        }}
      >
        <main className="max-w-5xl mx-auto px-4 pt-12 pb-80 space-y-8">
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
    match /merit_records/{document=**} {
      // Anyone can view the leaderboard
      allow read: if true; 
      
      // Strict data validation to block trolls and impossible scores
      allow write: if request.resource.data.scoreTET2 >= 0 
                   && request.resource.data.scoreTET2 <= 121
                   && request.resource.data.score12th >= 0 
                   && request.resource.data.score12th <= 100
                   && request.resource.data.scoreGrad >= 0 
                   && request.resource.data.scoreGrad <= 100
                   && request.resource.data.scoreBEd >= 0 
                   && request.resource.data.scoreBEd <= 100
                   && request.resource.data.finalScore <= 72
                   && !(request.resource.data.name.lower().matches('.*(naughty america|mother chod|meloni|sunny leone).*'));
    }
    
    match /trash_records/{document=**} {
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
              <CalculatorForm 
                onSubmit={handleSubmit} 
                records={effectiveRecords}
                onCategoryChange={setSelectedCategory}
                onVerify={handleVerify}
                onVerifyBySlNo={handleVerifyBySlNo}
              />
            </div>

            {/* Right Column: Teaser/Navigation */}
            <div className="glass-panel rounded-3xl p-8 text-zinc-900 shadow-xl flex flex-col items-center justify-center text-center space-y-6 min-h-[400px] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-amber-500/20 animate-gradient-xy"></div>
              <div className="relative z-10 space-y-2">
                <h2 className="text-3xl font-bold">View Merit List</h2>
              </div>
              <button
                onClick={() => handleViewChange('leaderboard')}
                className="glass-button px-8 py-4 bg-white/80 text-zinc-900 font-bold rounded-2xl shadow-lg hover:bg-white transition-all active:scale-95 w-full max-w-xs border border-white/50"
              >
                Go to Leaderboard
              </button>
              
              <div className="relative z-10 flex flex-col gap-3 w-full max-w-xs mt-4">
                <button 
                  onClick={() => setShowNonVerifiedPopup(true)}
                  className="glass-button px-6 py-3 bg-white/50 hover:bg-white/80 text-zinc-900 font-bold rounded-xl shadow-sm transition-all text-sm border border-white/40"
                >
                  Non-Verified Candidates
                </button>
                <button 
                  onClick={() => setShowUnregisteredPopup(true)}
                  className="glass-button px-6 py-3 bg-white/50 hover:bg-white/80 text-zinc-900 font-bold rounded-xl shadow-sm transition-all text-sm border border-white/40"
                >
                  Unregistered Candidates
                </button>
                <a 
                  href="https://wa.me/917005893480"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-button px-6 py-3 bg-red-600/90 hover:bg-red-600 text-white font-bold rounded-xl shadow-sm transition-all text-sm flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  Report False Entry
                </a>
                <button 
                  onClick={handleDownloadCommonList}
                  className="glass-button px-6 py-3 bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-sm transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download common category list
                </button>
                <button 
                  onClick={handleDownloadMissingList}
                  className="glass-button px-6 py-3 bg-blue-600/90 hover:bg-blue-600 text-white font-bold rounded-xl shadow-sm transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download missing list
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-center">
              <div className="text-sm font-medium text-zinc-500">
                Showing {getDisplayCount()} candidates
              </div>
            </div>

            <button
              onClick={() => handleViewChange('calculator')}
              className="fixed bottom-1 right-2 sm:bottom-4 sm:right-4 z-50 flex items-center gap-1.5 px-4 py-2.5 bg-zinc-900 text-white hover:bg-zinc-800 hover:-translate-y-1 active:scale-95 rounded-full shadow-[0_0_5px_rgba(0,0,0,0.5),0_0_15px_rgba(0,0,0,0.3),0_0_30px_rgba(0,0,0,0.2),0_0_50px_rgba(0,0,0,0.15),0_0_80px_rgba(0,0,0,0.1)] font-bold text-[10px] sm:text-xs transition-all"
            >
              ← Go Back
            </button>

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
      <footer className="max-w-5xl mx-auto px-4 py-12 border-t border-black/5 mt-12">
        <div className="flex flex-col items-center text-center space-y-4">
          <p className="text-[10px] text-zinc-400 max-w-md">
            Built with modern web technologies to provide candidates with accurate merit calculations and real-time competitive analysis.
          </p>
        </div>
      </footer>
      </div>

      {/* Predictions Popup */}
      {showPredictionsPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-panel max-w-md w-full p-6 animate-in zoom-in-95 duration-300 rounded-3xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-zinc-900">Predictions</h3>
              <button 
                onClick={() => setShowPredictionsPopup(false)}
                className="text-zinc-400 hover:text-zinc-600 hover:bg-white/50 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-amber-100/50 backdrop-blur-sm border border-amber-200/50 p-4 rounded-xl text-center shadow-inner">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
                  Predicted UR Cutoff (for 507 posts)
                </p>
                <p className="text-3xl font-black text-amber-900">{predictedCutoff}</p>
              </div>

              {!isAdmin && (
                <button 
                  onClick={() => {
                    setShowPredictionsPopup(false);
                    handlePredictRankClick();
                  }}
                  className="glass-button w-full bg-red-50/80 border border-red-200/50 p-4 rounded-xl text-center hover:bg-red-100/80 transition-colors active:scale-[0.98] shadow-sm"
                >
                  <p className="text-sm font-bold text-red-700 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                    Know your predicted rank for 507 vacancies
                  </p>
                  <p className="text-xs text-red-900 font-medium">Click to view prediction</p>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Predict Rank Message Modal */}
      {predictRankMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-panel max-w-sm w-full p-6 animate-in zoom-in-95 duration-300 rounded-3xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100/50 backdrop-blur-sm flex items-center justify-center text-indigo-600 border border-indigo-200/50 shadow-inner">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 mb-2">Predicted Rank</h3>
                <p className="text-zinc-700 text-sm leading-relaxed font-medium">
                  {predictRankMessage}
                </p>
              </div>
              <button
                onClick={() => setPredictRankMessage(null)}
                className="glass-button w-full mt-2 px-4 py-2.5 bg-zinc-900/90 text-white font-bold rounded-xl hover:bg-zinc-900 transition-colors active:scale-95 shadow-lg shadow-zinc-900/20"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Non-Verified Candidates Popup */}
      {showNonVerifiedPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-panel max-w-2xl w-full max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-300 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/40 bg-white/30 backdrop-blur-md flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-zinc-900">Non-Verified Candidates</h3>
                <p className="text-sm text-zinc-600 mt-1 font-medium">Candidates with entries but not verified</p>
              </div>
              <button 
                onClick={() => setShowNonVerifiedPopup(false)}
                className="text-zinc-400 hover:text-zinc-600 hover:bg-white/50 p-1.5 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div 
              className="px-6 pt-8 pb-8 overflow-y-auto flex-1 bg-white/10"
              style={{ 
                maskImage: 'linear-gradient(to bottom, transparent, black 40px, black calc(100% - 40px), transparent)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 40px, black calc(100% - 40px), transparent)'
              }}
            >
              <div className="space-y-3">
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unregistered Candidates Popup */}
      {showUnregisteredPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-panel max-w-2xl w-full max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-300 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/40 bg-white/30 backdrop-blur-md flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-zinc-900">Unregistered Candidates</h3>
                <p className="text-sm text-zinc-600 mt-1 font-medium">Candidates in CSV but not verified</p>
              </div>
              <button 
                onClick={() => setShowUnregisteredPopup(false)}
                className="text-zinc-400 hover:text-zinc-600 hover:bg-white/50 p-1.5 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div 
              className="px-6 pt-8 pb-8 overflow-y-auto flex-1 bg-white/10"
              style={{ 
                maskImage: 'linear-gradient(to bottom, transparent, black 40px, black calc(100% - 40px), transparent)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 40px, black calc(100% - 40px), transparent)'
              }}
            >
              <div className="space-y-3">
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full screen transition overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 z-[100] bg-zinc-50/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
          <p className="text-lg font-bold text-zinc-700">
            {transitionText}
          </p>
        </div>
      )}
    </div>
  );
}
