import React, { useState } from 'react';
import { HelpCircle, Mail, Phone, X } from 'lucide-react';

export const HelpDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-semibold rounded-xl transition-all active:scale-95"
      >
        <HelpCircle className="w-4 h-4" />
        Help
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-black/5 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900">Contact Support</h3>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-600">
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

            <div className="p-4 bg-zinc-50 border-t border-zinc-100 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2 text-sm font-bold text-zinc-900 hover:bg-zinc-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
