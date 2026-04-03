import { useCartStore } from '../store/cartStore';
import { Deal, DealOrderItem, DealChild } from '../types';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

export const useDealAdd = () => {
  const { addItem } = useCartStore();

  const handleDealAdd = (deal: Deal) => {
    const children: DealChild[] = deal.items.map(item => ({
      id: item.menuItemId,
      name: item.menuItemName,
      qty: item.qty,
      price: item.price
    }));

    const dealItem: DealOrderItem = {
      id: uuidv4(),
      dealId: deal.id,
      type: 'deal',
      name: deal.name,
      price: deal.price,
      basePrice: deal.price,
      qty: 1,
      total: deal.price,
      children
    };

    addItem(dealItem);
    toast.success(`🔥 ${deal.name} added — PKR ${deal.price.toLocaleString()}`);
  };

  return { handleDealAdd };
};
