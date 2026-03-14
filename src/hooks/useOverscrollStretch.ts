import { useEffect, useRef } from 'react';

export function useOverscrollStretch() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    const contentEl = contentRef.current;
    if (!scrollEl || !contentEl) return;

    let startY = 0;
    let currentY = 0;
    let isOverscrolling = false;
    let overscrollDirection = 0; // 1 for top, -1 for bottom
    
    // For momentum bounce
    let lastScrollTop = scrollEl.scrollTop;
    let lastScrollTime = performance.now();
    let scrollVelocity = 0;
    let isMomentumBouncing = false;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      currentY = startY;
      isOverscrolling = false;
      isMomentumBouncing = false;
      
      // Reset any existing transition
      contentEl.style.transition = 'none';
      contentEl.style.transform = 'translateY(0px)';
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!scrollEl || !contentEl || isMomentumBouncing) return;
      
      currentY = e.touches[0].clientY;
      let deltaY = currentY - startY;
      
      const currentIsAtTop = scrollEl.scrollTop <= 0;
      const currentIsAtBottom = Math.ceil(scrollEl.clientHeight + scrollEl.scrollTop) >= scrollEl.scrollHeight;

      if (!isOverscrolling) {
        if (currentIsAtTop && deltaY > 0) {
          isOverscrolling = true;
          overscrollDirection = 1;
          startY = currentY;
          deltaY = 0;
        } else if (currentIsAtBottom && deltaY < 0) {
          isOverscrolling = true;
          overscrollDirection = -1;
          startY = currentY;
          deltaY = 0;
        }
      }

      if (isOverscrolling) {
        // If user reverses direction and goes back into scrollable area
        if ((overscrollDirection === 1 && deltaY < 0) || (overscrollDirection === -1 && deltaY > 0)) {
          isOverscrolling = false;
          contentEl.style.transform = 'translateY(0px)';
          return;
        }

        // Prevent default scrolling behavior while bouncing
        if (e.cancelable) {
          e.preventDefault();
        }

        // Calculate bounce distance (iOS-style rubber band effect)
        const pullDistance = Math.abs(deltaY);
        const c = 150; // Rubber band constant
        const translateY = Math.sign(deltaY) * c * Math.log(1 + pullDistance / c);
        
        contentEl.style.transform = `translateY(${translateY}px)`;
      }
    };

    const handleTouchEnd = () => {
      if (isOverscrolling && contentEl) {
        // Spring back animation
        contentEl.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        contentEl.style.transform = 'translateY(0px)';
        
        // Clean up transition after animation completes
        setTimeout(() => {
          if (contentEl) contentEl.style.transition = 'none';
        }, 500);
      }
      isOverscrolling = false;
    };

    const handleScroll = () => {
      if (isOverscrolling || isMomentumBouncing) return;

      const now = performance.now();
      const dt = now - lastScrollTime;
      const currentScrollTop = scrollEl.scrollTop;
      const dy = currentScrollTop - lastScrollTop;
      
      if (dt > 0 && Math.abs(dy) > 0) {
        scrollVelocity = dy / dt;
      }
      
      lastScrollTop = currentScrollTop;
      lastScrollTime = now;

      const isAtTop = currentScrollTop <= 0;
      const isAtBottom = Math.ceil(scrollEl.clientHeight + currentScrollTop) >= scrollEl.scrollHeight;

      // If we hit the top or bottom with significant velocity
      if ((isAtTop && scrollVelocity < -0.5) || (isAtBottom && scrollVelocity > 0.5)) {
        isMomentumBouncing = true;
        
        // Calculate bounce amount based on velocity
        const bounceAmount = Math.min(Math.abs(scrollVelocity) * 40, 100);
        const translateY = isAtTop ? bounceAmount : -bounceAmount;
        
        // Apply bounce
        contentEl.style.transition = 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)';
        contentEl.style.transform = `translateY(${translateY}px)`;
        
        // Spring back
        setTimeout(() => {
          if (!contentEl) return;
          contentEl.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
          contentEl.style.transform = 'translateY(0px)';
          
          setTimeout(() => {
            if (!contentEl) return;
            contentEl.style.transition = 'none';
            isMomentumBouncing = false;
          }, 600);
        }, 150);
        
        scrollVelocity = 0;
      }
    };

    // Use passive: false for touchmove to allow preventDefault
    scrollEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    scrollEl.addEventListener('touchmove', handleTouchMove, { passive: false });
    scrollEl.addEventListener('touchend', handleTouchEnd, { passive: true });
    scrollEl.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    scrollEl.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollEl.removeEventListener('touchstart', handleTouchStart);
      scrollEl.removeEventListener('touchmove', handleTouchMove);
      scrollEl.removeEventListener('touchend', handleTouchEnd);
      scrollEl.removeEventListener('touchcancel', handleTouchEnd);
      scrollEl.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return { scrollRef, contentRef };
}
