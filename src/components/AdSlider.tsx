import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const AD_URL = "https://www.samsung.com/in/smartphones/galaxy-s26-ultra/buy/?cid=in_ow_app_s-members_galaxy-s26-series_launch_galaxy-forever_banner_none_none";

const AD_IMAGES = [
  "https://i.postimg.cc/7P9g5Zrt/AISelect-20260324-183838-Samsung-Members.jpg", // Ad 1 (Samsung Galaxy S26)
  "https://i.postimg.cc/vZVgtQCT/Screenshot-20260324-183959-Gallery.jpg", // Ad 2
  "https://i.postimg.cc/h42dSZ9W/AISelect-20260324-183850-Samsung-Members.jpg"  // Ad 3
];

const variants = {
  enter: (direction: number) => {
    return {
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0
    };
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0
    };
  }
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export function AdSlider() {
  const [[page, direction], setPage] = useState([0, 0]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Wrap the index so it loops infinitely
  const imageIndex = ((page % AD_IMAGES.length) + AD_IMAGES.length) % AD_IMAGES.length;

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      paginate(1);
    }, 4000); // Switch every 4 seconds
    return () => clearInterval(timer);
  }, [page]); // Reset timer when page changes manually

  return (
    <div className="w-full mt-8 mb-4">
      <div 
        className="block relative w-full aspect-[16/9] sm:aspect-[21/9] md:aspect-[3/1] bg-white rounded-2xl overflow-hidden shadow-lg group border border-white/20 cursor-pointer"
        onClick={() => {
          if (!isDragging) {
            window.open(AD_URL, '_blank', 'noopener,noreferrer');
          }
        }}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.img
            key={page}
            src={AD_IMAGES[imageIndex]}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e, { offset, velocity }) => {
              setTimeout(() => setIsDragging(false), 50); // Small delay to prevent click
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            alt={`Advertisement ${imageIndex + 1}`}
            className="absolute inset-0 w-full h-full object-contain"
            referrerPolicy="no-referrer"
            draggable={false} // Prevent default browser image dragging
          />
        </AnimatePresence>
        
        {/* Ad badge */}
        <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md text-white/90 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider z-10 border border-white/10 pointer-events-none">
          Ad
        </div>

        {/* Navigation dots */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
          {AD_IMAGES.map((_, idx) => (
            <div 
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === imageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
