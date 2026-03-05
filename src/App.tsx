import { useState, useEffect } from 'react';
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
import { Sparkles, AlertCircle, Database, Shield, Download } from 'lucide-react';

export default function App() {
  const [records, setRecords] = useState<CandidateRecord[]>([]);
  const [trashIds, setTrashIds] = useState<Set<string>>(new Set());
  const [trashError, setTrashError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'calculator' | 'leaderboard'>('calculator');
  const [isAdmin, setIsAdmin] = useState(false);
  const [predictRankMessage, setPredictRankMessage] = useState<string | null>(null);

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

  const getDisplayCount = () => {
    if (selectedCategory === 'Trash') return effectiveRecords.filter(r => r.isHidden).length;
    const visible = effectiveRecords.filter(r => !r.isHidden);
    if (selectedCategory === 'All') return visible.filter(r => r.scoreTET2 >= 90).length;
    return visible.filter(r => r.category === selectedCategory).length;
  };

  const allList = effectiveRecords.filter(r => !r.isHidden && r.scoreTET2 >= 90);

  const handleDownloadPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.text("Merit List (All)", 14, 15);
      
      doc.setFontSize(12);
      doc.text("rank ,tet- weightage", 14, 25);
      
      let y = 35;
      allList.forEach((record, index) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(`${index + 1}- ${record.scoreTET2}-${record.finalScore.toFixed(3)}`, 14, y);
        y += 7;
      });
      
      doc.save("merit_list.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
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
    
    actualCutoff = rawCutoff.toFixed(3);

    let adjustedCutoff = rawCutoff - 1.4;
    if (adjustedCutoff < 64.9) {
      adjustedCutoff = 64.9;
    }
    predictedCutoff = isAdmin ? adjustedCutoff.toFixed(3) : "66.120";
  } else if (!isAdmin) {
    predictedCutoff = "66.120";
  }

  const handlePredictRankClick = () => {
    const remaining = 700 - allList.length;
    setPredictRankMessage(`To predict your rank, add ${remaining} more who got 90 or above.`);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header */}
      <header className="bg-white border-b border-black/5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-emerald-500/20 border border-emerald-600/20 shrink-0 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-700">
              <span className="text-white font-black text-sm tracking-tighter">TTET</span>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">TET 2 Merit</h1>
              <p className="text-xs text-zinc-500 font-medium">Calculator & Leaderboard</p>
            </div>
          </div>
          
          <div className="hidden md:block text-center">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">Developed by:</p>
            <p className="text-sm font-bold text-zinc-900 tracking-tight uppercase">
              Er. SUBHAJIT DASGUPTA
            </p>
            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mb-1.5">
              NITA 2020 ALUMNUS
            </p>
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex items-center justify-center gap-2">
                <div className="inline-block bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md shadow-sm">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                    Total Candidates: <span className="text-emerald-900 text-xs ml-1">{effectiveRecords.filter(r => !r.isHidden).length}</span>
                  </p>
                </div>
                <div className="inline-block bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md shadow-sm">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                    Predicted UR Cutoff (for 507 posts): <span className="text-amber-900 text-xs ml-1">{predictedCutoff}</span>
                  </p>
                </div>
                {isAdmin && (
                  <>
                    <div className="inline-block bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-md shadow-sm">
                      <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                        Actual Cutoff (Admin): <span className="text-purple-900 text-xs ml-1">{actualCutoff}</span>
                      </p>
                    </div>
                    <button 
                      onClick={handleDownloadPDF}
                      className="inline-block bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md shadow-sm hover:bg-blue-100 transition-colors active:scale-95"
                    >
                      <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                        <Download className="w-3 h-3" /> Download PDF
                      </p>
                    </button>
                  </>
                )}
              </div>
              {!isAdmin && (
                <button 
                  onClick={handlePredictRankClick}
                  className="relative group overflow-hidden inline-block bg-red-50 border border-red-200 px-3 py-0.5 rounded-md shadow-sm hover:bg-red-100 transition-all active:scale-95 animate-button-glow"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  <p className="relative text-[10px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-red-500 animate-pulse" />
                    Know your predicted rank for 507 vacancies
                    <Sparkles className="w-3 h-3 text-red-500 animate-pulse" />
                  </p>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SearchDialog records={effectiveRecords} />
            <HelpDialog isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
          </div>
        </div>
        {/* Mobile Dev Name */}
        <div className="md:hidden px-4 py-2 border-t border-zinc-50 text-center bg-zinc-50/50 flex flex-col items-center gap-1.5">
          <p className="text-[10px] font-bold text-zinc-900 tracking-tight uppercase">
            Developed by: Er. SUBHAJIT DASGUPTA (NITA 2020 ALUMNUS)
          </p>
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="inline-block bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md shadow-sm">
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Total Candidates: <span className="text-emerald-900 text-xs ml-1">{effectiveRecords.filter(r => !r.isHidden).length}</span>
                </p>
              </div>
              <div className="inline-block bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md shadow-sm">
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                  Predicted UR Cutoff (for 507 posts): <span className="text-amber-900 text-xs ml-1">{predictedCutoff}</span>
                </p>
              </div>
              {isAdmin && (
                <>
                  <div className="inline-block bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-md shadow-sm">
                    <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                      Actual Cutoff (Admin): <span className="text-purple-900 text-xs ml-1">{actualCutoff}</span>
                    </p>
                  </div>
                  <button 
                    onClick={handleDownloadPDF}
                    className="inline-block bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md shadow-sm hover:bg-blue-100 transition-colors active:scale-95"
                  >
                    <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                      <Download className="w-3 h-3" /> Download PDF
                    </p>
                  </button>
                </>
              )}
            </div>
            {!isAdmin && (
              <button 
                onClick={handlePredictRankClick}
                className="relative group overflow-hidden inline-block bg-red-50 border border-red-200 px-3 py-0.5 rounded-md shadow-sm hover:bg-red-100 transition-all active:scale-95 animate-button-glow"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <p className="relative text-[10px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-red-500 animate-pulse" />
                  Know your predicted rank for 507 vacancies
                  <Sparkles className="w-3 h-3 text-red-500 animate-pulse" />
                </p>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {!isFirebaseConfigured && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900">Firebase Configuration Required</h3>
              <p className="text-sm text-amber-800 mt-1">
                To enable real-time database syncing, please configure your Firebase credentials in the <code className="bg-amber-100 px-1 rounded">.env</code> file. 
              </p>
            </div>
          </div>
        )}

        {trashError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
            <Shield className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div className="w-full">
              <h3 className="font-bold text-red-900">Firestore Security Rules Update Required</h3>
              <p className="text-sm text-red-800 mt-1 mb-3">
                To use the Trash feature, you must allow access to the <code>trash_records</code> collection. 
                Go to your Firebase Console &gt; Firestore Database &gt; Rules, and add the following:
              </p>
              <pre className="bg-red-100/50 p-4 rounded-xl text-sm text-red-900 overflow-x-auto border border-red-200 font-mono">
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
              />
            </div>

            {/* Right Column: Teaser/Navigation */}
            <div className="bg-emerald-600 rounded-3xl p-8 text-white shadow-xl shadow-emerald-500/20 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px]">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                <Database className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">View Merit List</h2>
                <p className="text-emerald-50 max-w-xs mx-auto">
                  Check your rank among other candidates in real-time. Filtered by category and sorted by merit.
                </p>
              </div>
              <button
                onClick={() => setCurrentView('leaderboard')}
                className="px-8 py-4 bg-white text-emerald-600 font-bold rounded-2xl shadow-lg hover:bg-emerald-50 transition-all active:scale-95"
              >
                Go to Leaderboard
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentView('calculator')}
                className="flex items-center gap-2 px-4 py-2 text-zinc-600 hover:text-zinc-900 font-bold transition-all"
              >
                ← Back to Calculator
              </button>
              <div className="text-sm font-medium text-zinc-500">
                Showing {getDisplayCount()} candidates
              </div>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-2xl h-[400px] flex flex-col items-center justify-center gap-4 border border-black/5">
                <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-sm font-medium text-zinc-500">Loading leaderboard...</p>
              </div>
            ) : (
              <Leaderboard 
                records={effectiveRecords} 
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                isAdmin={isAdmin}
                onHide={handleHide}
                onRestore={handleRestore}
              />
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

      {/* Predict Rank Message Modal */}
      {predictRankMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 mb-2">Predicted Rank</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  {predictRankMessage}
                </p>
              </div>
              <button
                onClick={() => setPredictRankMessage(null)}
                className="w-full mt-2 px-4 py-2 bg-zinc-900 text-white font-medium rounded-xl hover:bg-zinc-800 transition-colors active:scale-95"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
