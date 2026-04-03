import { Ingredient, HistoryOrder } from '../types';
import { useInventoryStore } from '../store/inventoryStore';
import { useRecipeStore } from '../store/recipeStore';
import { useToastStore } from '../store/toastStore';

export const getStockStatus = (qty: number, minThreshold: number): 'ok' | 'low' | 'critical' | 'empty' => {
  if (qty === 0) return 'empty';
  if (qty < minThreshold * 0.5) return 'critical';
  if (qty <= minThreshold) return 'low';
  return 'ok';
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'empty': return 'bg-red-600 text-white';
    case 'critical': return 'bg-red-500 text-white';
    case 'low': return 'bg-orange-500 text-white';
    case 'ok': return 'bg-green-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'empty': return 'EMPTY';
    case 'critical': return 'CRITICAL';
    case 'low': return 'LOW';
    case 'ok': return 'OK';
    default: return status.toUpperCase();
  }
};

export const formatQty = (qty: number, unit: string): string => {
  return `${qty.toLocaleString()} ${unit}`;
};

export const calcStockValue = (ingredients: Ingredient[], stock: Record<string, number>): number => {
  return ingredients.reduce((acc, ing) => {
    const qty = stock[ing.id] || 0;
    return acc + qty * ing.costPerUnit;
  }, 0);
};

export const generateIngredientId = (): string => {
  return `ING-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

export const generateMovementId = (): string => {
  return `MOV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

export const deductStockForOrder = (order: HistoryOrder): void => {
  const { adjustStock, ingredients } = useInventoryStore.getState();
  const { recipes } = useRecipeStore.getState();
  const { showToast } = useToastStore.getState();

  const processItem = (menuItemId: string, qty: number, orderId: string) => {
    const recipe = recipes.find(r => r.menuItemId === menuItemId);
    if (recipe) {
      recipe.ingredients.forEach(ri => {
        const totalDeduction = ri.qty * qty;
        const newQty = adjustStock(ri.ingredientId, -totalDeduction, `Order #${orderId}`, 'SALE');
        
        const ing = ingredients.find(i => i.id === ri.ingredientId);
        if (ing && newQty <= ing.minThreshold) {
          showToast(`Low stock: ${ing.name} (${newQty} ${ing.unit})`, 'warning');
        }
      });
    }
  };

  order.items.forEach(item => {
    if (item.type === 'deal') {
      const dealItem = item as any; // Cast to access children
      dealItem.children?.forEach((child: any) => {
        processItem(child.menuItemId, child.qty * item.qty, order.id);
      });
    } else {
      processItem(item.id, item.qty, order.id);
    }
  });
};
