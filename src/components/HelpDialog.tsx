import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, Mail, Phone, X, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

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
        className="flex items-center justify-center gap-1.5 w-full sm:w-40 px-2 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-700 hover:text-emerald-800 glass-morphism-button"
        title="Help & Support"
      >
        <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 relative z-10" />
        <span className="whitespace-nowrap relative z-10">Help</span>
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              key="help-dialog-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
            >
              <motion.div 
                key="help-dialog-content"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 12, stiffness: 400 }}
                className="glass-morphism w-full max-w-sm rounded-3xl overflow-hidden"
              >
              <div className="p-6 border-b border-white/40 bg-white/30 backdrop-blur-md flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900">Contact Support</h3>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  setShowAdminLogin(false);
                  setPassword('');
                }} 
                className="glass-morphism-button-red p-2 rounded-full flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5 text-white stroke-[3] drop-shadow-md" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center justify-center gap-6 py-4">
                <a 
                  href="tel:7005893480" 
                  className="flex flex-col items-center gap-2 group"
                  title="Call Us"
                >
                  <div className="p-4 bg-blue-100/50 backdrop-blur-sm rounded-2xl border border-blue-200/50 group-hover:bg-blue-100 group-hover:scale-110 transition-all shadow-sm">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-xs font-bold text-zinc-600 group-hover:text-blue-600 transition-colors">Phone</span>
                </a>

                <a 
                  href="mailto:sdasgupta15uce019@gmail.com" 
                  className="flex flex-col items-center gap-2 group"
                  title="Email Us"
                >
                  <div className="p-4 bg-emerald-100/50 backdrop-blur-sm rounded-2xl border border-emerald-200/50 group-hover:bg-emerald-100 group-hover:scale-110 transition-all shadow-sm">
                    <Mail className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="text-xs font-bold text-zinc-600 group-hover:text-emerald-600 transition-colors">Email</span>
                </a>

                <a 
                  href="https://wa.me/917005893480" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 group"
                  title="WhatsApp Us"
                >
                  <div className="p-4 bg-green-100/50 backdrop-blur-sm rounded-2xl border border-green-200/50 group-hover:bg-green-100 group-hover:scale-110 transition-all shadow-sm">
                    <WhatsAppIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-xs font-bold text-zinc-600 group-hover:text-green-600 transition-colors">WhatsApp</span>
                </a>
              </div>

              <div className="p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-white/50">
                <p className="text-sm text-zinc-700 leading-relaxed font-medium">
                  For any queries regarding merit calculation or technical issues, please feel free to reach out via email or phone.
                </p>
              </div>
            </div>

            <div className="p-6 bg-white/30 backdrop-blur-md border-t border-white/40">
              {isAdmin ? (
                <button
                  onClick={handleExitAdmin}
                  className="glass-button w-full py-3 bg-red-500/90 text-white font-bold rounded-xl hover:bg-red-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
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
                    className="glass-input w-full px-4 py-3 rounded-xl text-zinc-900 placeholder:text-zinc-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdminSubmit();
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAdminLogin(false)}
                      className="glass-button flex-1 py-3 bg-white/50 text-zinc-700 font-bold rounded-xl hover:bg-white/80 transition-colors border border-white/40"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAdminSubmit}
                      className="glass-button flex-1 py-3 bg-emerald-600/90 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      Login
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAdminLogin(true)}
                  className="glass-button w-full py-3 bg-zinc-900/90 text-white font-bold rounded-xl hover:bg-zinc-900 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/20"
                >
                  <Shield className="w-4 h-4" />
                  GO TO ADMIN PORTAL
                </button>
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
