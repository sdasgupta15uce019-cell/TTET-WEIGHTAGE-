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
import { AlertCircle, Database, Shield } from 'lucide-react';

export default function App() {
  const [records, setRecords] = useState<CandidateRecord[]>([]);
  const [trashIds, setTrashIds] = useState<Set<string>>(new Set());
  const [trashError, setTrashError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'calculator' | 'leaderboard'>('calculator');
  const [isAdmin, setIsAdmin] = useState(false);

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
    if (selectedCategory === 'All') return visible.length;
    return visible.filter(r => r.category === selectedCategory).length;
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
            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
              NITA 2020 ALUMNUS
            </p>
          </div>

          <div className="flex items-center gap-2">
            <SearchDialog records={effectiveRecords} />
            <HelpDialog isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
          </div>
        </div>
        {/* Mobile Dev Name */}
        <div className="md:hidden px-4 py-2 border-t border-zinc-50 text-center bg-zinc-50/50">
          <p className="text-[10px] font-bold text-zinc-900 tracking-tight uppercase">
            Developed by: Er. SUBHAJIT DASGUPTA (NITA 2020 ALUMNUS)
          </p>
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
    </div>
  );
}
