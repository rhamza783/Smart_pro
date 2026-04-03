import { useState, useCallback } from 'react';
import { MenuItem, Variant, SelectedModifier, OrderItem } from '../types';
import { useCartStore } from '../store/cartStore';
import { useToastStore } from '../store/toastStore';
import { usePrompt } from './usePrompt';

export const useItemAdd = () => {
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [modifierModalOpen, setModifierModalOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

  const { currentTable, addItem } = useCartStore();
  const { showToast } = useToastStore();
  const { askPrice, askQty, askWeight, askBoth } = usePrompt();

  const handleItemAdd = useCallback(async (item: MenuItem) => {
    if (!currentTable) {
      showToast('Please select a table first', 'error');
      return;
    }

    let finalPrice = item.price;
    let finalQty = 1;

    if (item.askPrice && item.askQty) {
      const res = await askBoth(`Custom ${item.name}`, item.price, 1, item.name);
      if (!res) return;
      finalPrice = res.price;
      finalQty = res.qty;
    } else if (item.askPrice) {
      const price = await askPrice(`Enter Price for ${item.name}`, item.price, item.name);
      if (price === null) return;
      finalPrice = price;
    } else if (item.isWeightBased) {
      const res = await askWeight(`Enter Weight for ${item.name}`, item.price, item.name);
      if (res === null) return;
      finalQty = res.weight;
    } else if (item.askQty) {
      const qty = await askQty(`Enter Qty for ${item.name}`, 1, item.name);
      if (qty === null) return;
      finalQty = qty;
    }

    setPendingItem({ ...item, price: finalPrice });

    if (item.variants && item.variants.length > 0) {
      setVariantModalOpen(true);
    } else if (item.modifiers && item.modifiers.length > 0) {
      setModifierModalOpen(true);
    } else {
      const orderItem: OrderItem = {
        id: item.id,
        name: item.name,
        price: finalPrice,
        basePrice: finalPrice,
        qty: finalQty,
        total: finalPrice * finalQty
      };
      addItem(orderItem);
      showToast(`${item.name} added`, 'success');
    }
  }, [currentTable, addItem, showToast, askPrice, askQty, askWeight, askBoth]);

  const onVariantSelect = (variant: Variant) => {
    setSelectedVariant(variant);
    setVariantModalOpen(false);

    if (pendingItem?.modifiers && pendingItem.modifiers.length > 0) {
      setModifierModalOpen(true);
    } else {
      completeAddition(variant.vPrice, [], variant.vName);
    }
  };

  const onModifiersConfirm = (modifiers: SelectedModifier[]) => {
    const basePrice = selectedVariant ? selectedVariant.vPrice : (pendingItem?.price || 0);
    const variantName = selectedVariant?.vName;
    completeAddition(basePrice, modifiers, variantName);
    setModifierModalOpen(false);
  };

  const completeAddition = (basePrice: number, modifiers: SelectedModifier[], variantName?: string) => {
    if (!pendingItem) return;

    const modifierTotal = modifiers.reduce((sum, m) => sum + (m.price * m.qty), 0);
    const finalPrice = basePrice + modifierTotal;
    const displayName = variantName ? `${pendingItem.name} (${variantName})` : pendingItem.name;

    const orderItem: OrderItem = {
      id: pendingItem.id,
      name: displayName,
      price: finalPrice,
      basePrice: basePrice,
      qty: 1,
      total: finalPrice,
      modifiers: modifiers.length > 0 ? modifiers : undefined
    };

    addItem(orderItem);
    showToast(`${displayName} added`, 'success');
    
    // Reset state
    setPendingItem(null);
    setSelectedVariant(null);
  };

  return {
    handleItemAdd,
    variantModalOpen,
    modifierModalOpen,
    setVariantModalOpen,
    setModifierModalOpen,
    variantModalProps: {
      item: pendingItem!,
      onSelect: onVariantSelect,
      onClose: () => setVariantModalOpen(false)
    },
    modifierModalProps: {
      item: pendingItem!,
      basePrice: selectedVariant ? selectedVariant.vPrice : (pendingItem?.price || 0),
      variantName: selectedVariant?.vName,
      onConfirm: onModifiersConfirm,
      onClose: () => setModifierModalOpen(false)
    }
  };
};
