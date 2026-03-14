import { useEffect, useRef } from 'react';

export function useOverscrollStretch() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    const contentEl = contentRef.current;
    if (!scrollEl || !contentEl) return;

    // Force hardware acceleration layer
    contentEl.style.willChange = 'transform';
    contentEl.style.transform = 'translate3d(0, 0px, 0) scale3d(1, 1, 1)';

    let startY = 0;
    let currentY = 0;
    let isOverscrolling = false;
    let overscrollDirection = 0; // 1 for top, -1 for bottom
    
    // For momentum bounce
    let lastScrollTop = scrollEl.scrollTop;
    let lastScrollTime = performance.now();
    let scrollVelocity = 0;
    let isMomentumBouncing = false;
    let bounceTimeout1: NodeJS.Timeout;
    let bounceTimeout2: NodeJS.Timeout;
    
    // For 120fps smooth rendering
    let rafId: number | null = null;
    let targetTranslateY = 0;
    let targetScaleY = 1;
    let currentTransformOrigin = 'top center';

    const updateTransform = () => {
      if (contentEl) {
        contentEl.style.transformOrigin = currentTransformOrigin;
        contentEl.style.transform = `translate3d(0, ${targetTranslateY}px, 0) scale3d(1, ${targetScaleY}, 1)`;
      }
      rafId = null;
    };

    const setTransform = (y: number, scale: number, origin: string = currentTransformOrigin) => {
      targetTranslateY = y;
      targetScaleY = scale;
      currentTransformOrigin = origin;
      if (rafId === null) {
        rafId = requestAnimationFrame(updateTransform);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      currentY = startY;
      isOverscrolling = false;
      
      if (isMomentumBouncing) {
        isMomentumBouncing = false;
        clearTimeout(bounceTimeout1);
        clearTimeout(bounceTimeout2);
      }
      
      // Reset any existing transition
      contentEl.style.transition = 'none';
      setTransform(0, 1);
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
          setTransform(0, 1);
          return;
        }

        // Prevent default scrolling behavior while stretching
        if (e.cancelable) {
          e.preventDefault();
        }

        // Calculate stretch distance (scale effect)
        const pullDistance = Math.abs(deltaY);
        const maxStretch = 0.15; // 15% max stretch
        const stretchAmount = maxStretch * (1 - Math.exp(-pullDistance / 300));
        const scaleY = 1 + stretchAmount;
        
        const origin = overscrollDirection === 1 ? 'top center' : 'bottom center';
        
        contentEl.style.transition = 'none';
        setTransform(0, scaleY, origin);
      }
    };

    const handleTouchEnd = () => {
      if (isOverscrolling && contentEl) {
        // Spring back animation
        contentEl.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
        setTransform(0, 1);
        
        // Clean up transition after animation completes
        setTimeout(() => {
          if (contentEl && !isOverscrolling && !isMomentumBouncing) {
            contentEl.style.transition = 'none';
          }
        }, 400);
      }
      isOverscrolling = false;
    };

    const handleScroll = () => {
      if (isOverscrolling || isMomentumBouncing) return;

      const now = performance.now();
      const dt = now - lastScrollTime;
      const currentScrollTop = scrollEl.scrollTop;
      const dy = currentScrollTop - lastScrollTop;
      
      if (dt > 0) {
        const v = dy / dt;
        // Smooth velocity to prevent sudden drops right at the edge
        scrollVelocity = scrollVelocity === 0 ? v : (scrollVelocity * 0.6 + v * 0.4);
      }
      
      lastScrollTop = currentScrollTop;
      lastScrollTime = now;

      const isAtTop = currentScrollTop <= 0;
      const isAtBottom = Math.ceil(scrollEl.clientHeight + currentScrollTop) >= scrollEl.scrollHeight;

      // If we hit the top or bottom with significant velocity
      if ((isAtTop && scrollVelocity < -0.8) || (isAtBottom && scrollVelocity > 0.8)) {
        isMomentumBouncing = true;
        
        // Much softer bounce amount (max 35px instead of 100px)
        const bounceAmount = Math.min(Math.abs(scrollVelocity) * 10, 35);
        const translateY = isAtTop ? bounceAmount : -bounceAmount;
        
        // Soft ease-out for the initial hit
        contentEl.style.transition = 'transform 0.25s cubic-bezier(0.2, 0.6, 0.3, 1)';
        setTransform(translateY, 1);
        
        bounceTimeout1 = setTimeout(() => {
          if (!contentEl || !isMomentumBouncing) return;
          
          // Spring back
          contentEl.style.transition = 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)';
          setTransform(0, 1);
          
          bounceTimeout2 = setTimeout(() => {
            if (!contentEl) return;
            contentEl.style.transition = 'none';
            isMomentumBouncing = false;
          }, 450);
        }, 250);
        
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
      if (rafId !== null) cancelAnimationFrame(rafId);
      clearTimeout(bounceTimeout1);
      clearTimeout(bounceTimeout2);
      scrollEl.removeEventListener('touchstart', handleTouchStart);
      scrollEl.removeEventListener('touchmove', handleTouchMove);
      scrollEl.removeEventListener('touchend', handleTouchEnd);
      scrollEl.removeEventListener('touchcancel', handleTouchEnd);
      scrollEl.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return { scrollRef, contentRef };
}
