import { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

const makeCartItemKey = (product, variant) => `${product.id}:${variant?.label ?? product.unit ?? 'default'}`;

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // { key, product, quantity, variant }
  const [isOpen, setIsOpen] = useState(false);

  const addItem = (product, quantity = 1, variant = null) => {
    const key = makeCartItemKey(product, variant);
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { key, product, quantity, variant }];
    });
    setIsOpen(true);
  };

  const removeItem = (itemKey) => {
    setItems((prev) => prev.filter((i) => i.key !== itemKey));
  };

  const setQuantity = (itemKey, quantity) => {
    if (quantity <= 0) return removeItem(itemKey);
    setItems((prev) => prev.map((i) => (i.key === itemKey ? { ...i, quantity } : i)));
  };

  const clearCart = () => setItems([]);

  const { subtotal, itemCount } = useMemo(() => {
    return items.reduce(
      (acc, i) => {
        const price = i.variant?.sellingPrice ?? i.product.sellingPrice;
        acc.subtotal += price * i.quantity;
        acc.itemCount += i.quantity;
        return acc;
      },
      { subtotal: 0, itemCount: 0 }
    );
  }, [items]);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, setQuantity, clearCart, subtotal, itemCount, isOpen, setIsOpen }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
