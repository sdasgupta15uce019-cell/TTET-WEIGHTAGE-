import React, { useState } from 'react';
import { HelpCircle, Mail, Phone, X, Shield } from 'lucide-react';

interface HelpDialogProps {
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
}

export const HelpDialog: React.FC<HelpDialogProps> = ({ isAdmin, setIsAdmin }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [password, setPassword] = useState('');

  const handleAdminSubmit = () => {
    if (password === 'SubhajiT@328432') {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setPassword('');
      setIsOpen(false);
    } else {
      alert("Incorrect password.");
    }
  };

  const handleExitAdmin = () => {
    setIsAdmin(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-xl text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
        title="Help & Support"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-black/5 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900">Contact Support</h3>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  setShowAdminLogin(false);
                  setPassword('');
                }} 
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Mail className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Email</p>
                    <a href="mailto:sdasgupta15uce019@gmail.com" className="text-zinc-900 font-medium hover:text-emerald-600 transition-colors">
                      sdasgupta15uce019@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Phone</p>
                    <a href="tel:7005893480" className="text-zinc-900 font-medium hover:text-blue-600 transition-colors">
                      +91 7005893480
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <p className="text-sm text-zinc-600 leading-relaxed">
                  For any queries regarding merit calculation or technical issues, please feel free to reach out via email or phone.
                </p>
              </div>
            </div>

            <div className="p-6 bg-zinc-50 border-t border-zinc-100">
              {isAdmin ? (
                <button
                  onClick={handleExitAdmin}
                  className="w-full py-3 bg-red-100 text-red-700 font-bold rounded-xl hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  EXIT ADMIN PORTAL
                </button>
              ) : showAdminLogin ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter Admin Password"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdminSubmit();
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAdminLogin(false)}
                      className="flex-1 py-3 text-zinc-600 font-semibold hover:bg-zinc-200 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAdminSubmit}
                      className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors"
                    >
                      Login
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAdminLogin(true)}
                  className="w-full py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  GO TO ADMIN PORTAL
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
