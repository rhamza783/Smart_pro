import { usePromptStore } from '../store/promptStore';
import { useAuthStore } from '../store/authStore';

export const usePrompt = () => {
  const openPrompt = usePromptStore((state) => state.openPrompt);
  const workers = useAuthStore((state) => state.appWorkers);

  const askPrice = async (title: string, current?: number, itemName?: string) => {
    const result = await openPrompt({
      title,
      mode: 'price',
      currentPrice: current,
      itemName,
    });
    return result.price;
  };

  const askQty = async (title: string, current?: number, itemName?: string) => {
    const result = await openPrompt({
      title,
      mode: 'qty',
      currentQty: current,
      itemName,
    });
    return result.qty;
  };

  const askWeight = async (title: string, pricePerKg: number, itemName?: string) => {
    const result = await openPrompt({
      title,
      mode: 'weight',
      currentPrice: pricePerKg,
      itemName,
    });
    if (result.qty !== null && result.price !== null) {
      return { weight: result.qty, total: result.price };
    }
    return null;
  };

  const askText = async (title: string, current?: string, itemName?: string) => {
    const result = await openPrompt({
      title,
      mode: 'text',
      currentText: current,
      itemName,
    });
    return result.text;
  };

  const askPIN = async (title: string = 'Manager Approval Required') => {
    const result = await openPrompt({
      title,
      mode: 'password',
    });
    if (result.text) {
      // Check if PIN matches any admin or manager
      const isValid = workers.some(
        (w) => w.pass === result.text && (w.role === 'Admin' || w.role === 'Manager')
      );
      return isValid;
    }
    return false;
  };

  const askBoth = async (title: string, price: number, qty: number, itemName?: string) => {
    const result = await openPrompt({
      title,
      mode: 'both',
      currentPrice: price,
      currentQty: qty,
      itemName,
    });
    if (result.price !== null && result.qty !== null) {
      return { price: result.price, qty: result.qty };
    }
    return null;
  };

  const askConfirm = async (title: string, message: string) => {
    const result = await openPrompt({
      title,
      message,
      mode: 'confirm',
    });
    return result.text === 'confirmed';
  };

  return {
    askPrice,
    askQty,
    askWeight,
    askText,
    askPIN,
    askBoth,
    askConfirm,
  };
};
