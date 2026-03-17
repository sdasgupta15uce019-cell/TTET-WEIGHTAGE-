import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [animationClass, setAnimationClass] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Wait 2 seconds, then trigger the zoom animation
    const zoomTimer = setTimeout(() => {
      setAnimationClass('animate-splash-logo-zoom');
    }, 2000);

    // Trigger the home screen animation 0.2s before the splash finishes (2600ms - 200ms = 2400ms)
    const triggerAppTimer = setTimeout(() => {
      onComplete();
    }, 2400);

    // Wait for the animation to finish (0.6s), then remove the splash screen
    const removeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2600);

    return () => {
      clearTimeout(zoomTimer);
      clearTimeout(triggerAppTimer);
      clearTimeout(removeTimer);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {/* Black background that fades out when the logo zooms */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-500 ease-in-out ${
          animationClass ? 'opacity-0' : 'opacity-100'
        }`}
      />
      
      {/* TTET Logo that zooms in */}
      <div 
        className={`relative z-10 w-24 h-24 bg-[#00a859] rounded-2xl flex items-center justify-center shadow-2xl will-change-transform ${animationClass}`}
      >
        <span className="text-white font-bold text-3xl tracking-tighter">TTET</span>
      </div>
    </div>
  );
}
