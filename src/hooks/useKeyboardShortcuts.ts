import { useEffect } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { useLayoutStore } from '../store/layoutStore';

export const useKeyboardShortcuts = () => {
  const { shortcuts } = useSettingsStore();
  const { currentUser, logout } = useAuthStore();
  const { setActiveSection } = useLayoutStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentUser) return;

      // Ignore if typing in input/textarea
      const activeElement = document.activeElement;
      const isInput = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;
      if (isInput) return;

      const pressedKey = e.key.toUpperCase();
      const ctrl = e.ctrlKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      // Simple key matching (F1-F12) or complex combos
      const matchedShortcut = shortcuts.find(s => {
        const keyDef = s.key.toUpperCase();
        
        // Handle combos like CTRL+SHIFT+F
        if (keyDef.includes('+')) {
          const parts = keyDef.split('+');
          const hasCtrl = parts.includes('CTRL');
          const hasShift = parts.includes('SHIFT');
          const hasAlt = parts.includes('ALT');
          const mainKey = parts[parts.length - 1];

          return ctrl === hasCtrl && shift === hasShift && alt === hasAlt && pressedKey === mainKey;
        }

        return pressedKey === keyDef;
      });

      if (matchedShortcut) {
        e.preventDefault();
        
        switch (matchedShortcut.action) {
          case 'TOGGLE_DRAWER':
            // This is usually handled by a state in POSLayout, 
            // but we can trigger a custom event or use a store
            window.dispatchEvent(new CustomEvent('toggle-pos-drawer'));
            break;
          case 'FOCUS_SEARCH':
            const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
            if (searchInput) searchInput.focus();
            break;
          case 'OPEN_CUSTOMER':
            window.dispatchEvent(new CustomEvent('open-customer-modal'));
            break;
          case 'OPEN_DISCOUNT':
            window.dispatchEvent(new CustomEvent('open-discount-modal'));
            break;
          case 'PRINT_KOT':
            window.dispatchEvent(new CustomEvent('trigger-print-kot'));
            break;
          case 'PRINT_BILL':
            window.dispatchEvent(new CustomEvent('trigger-print-bill'));
            break;
          case 'OPEN_PAYMENT':
            window.dispatchEvent(new CustomEvent('open-payment-modal'));
            break;
          case 'LOGOUT':
            logout();
            break;
          default:
            console.log('Shortcut triggered:', matchedShortcut.action);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, currentUser, logout, setActiveSection]);
};
