import { useEffect } from 'react';

/**
 * Hook to handle keyboard appearance on mobile devices
 * Prevents input fields from being hidden behind the keyboard
 */
export const useKeyboardAvoidance = () => {
  useEffect(() => {
    // Only run on mobile devices
    if (typeof window === 'undefined' || window.innerWidth > 768) {
      return;
    }

    let originalHeight = window.innerHeight;

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = originalHeight - currentHeight;

      // If height decreased by more than 150px, keyboard is likely open
      if (heightDifference > 150) {
        document.body.classList.add('keyboard-open');
      } else {
        document.body.classList.remove('keyboard-open');
      }
    };

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        // Scroll the focused element into view with some padding
        setTimeout(() => {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }, 300);
      }
    };

    const handleBlur = () => {
      // Small delay to ensure keyboard has closed
      setTimeout(() => {
        document.body.classList.remove('keyboard-open');
      }, 100);
    };

    // Set initial height
    originalHeight = window.innerHeight;

    // Add event listeners
    window.addEventListener('resize', handleResize);
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
      document.body.classList.remove('keyboard-open');
    };
  }, []);
};

export default useKeyboardAvoidance;
