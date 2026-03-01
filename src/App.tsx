import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
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
import { AlertCircle, Database } from 'lucide-react';

export default function App() {
  const [records, setRecords] = useState<CandidateRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'calculator' | 'leaderboard'>('calculator');

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    // Fetch ALL records to calculate both All and Category ranks
    const q = query(collection(db, 'merit_records'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
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
      console.error("Firestore error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (record: Omit<CandidateRecord, 'id' | 'timestamp'>) => {
    if (!isFirebaseConfigured) {
      alert("Firebase is not configured. Please add your Firebase credentials to the environment variables.");
      return;
    }

    try {
      console.log("Submitting record...", record);
      await addDoc(collection(db, 'merit_records'), {
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

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header */}
      <header className="bg-white border-b border-black/5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Database className="w-6 h-6 text-white" />
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
            <SearchDialog records={records} />
            <HelpDialog />
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

        {currentView === 'calculator' ? (
          <div className="grid lg:grid-cols-[400px,1fr] gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Left Column: Form */}
            <div className="space-y-6">
              <CalculatorForm 
                onSubmit={handleSubmit} 
                records={records}
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
                Showing {selectedCategory === 'All' ? records.length : records.filter(r => r.category === selectedCategory).length} candidates
              </div>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-2xl h-[400px] flex flex-col items-center justify-center gap-4 border border-black/5">
                <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-sm font-medium text-zinc-500">Loading leaderboard...</p>
              </div>
            ) : (
              <Leaderboard 
                records={records} 
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
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
