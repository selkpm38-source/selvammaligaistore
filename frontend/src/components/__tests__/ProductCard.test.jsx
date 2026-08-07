import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductCard from '../ProductCard.jsx';

const addItemMock = vi.fn();

vi.mock('../../context/CartContext.jsx', () => ({
  useCart: () => ({ addItem: addItemMock }),
}));

describe('ProductCard unit selection', () => {
  beforeEach(() => {
    addItemMock.mockReset();
  });

  it('allows selecting another unit and quantity before adding to cart', () => {
    const product = {
      id: 'p1',
      name: 'Rice',
      image: '🍚',
      rating: 4.6,
      ratingCount: 12,
      mrp: 20,
      sellingPrice: 18,
      discountPercentage: 10,
      unit: '100g',
      variants: [
        { label: '250g', mrp: 45, sellingPrice: 40, discountPercentage: 11 },
        { label: '500g', mrp: 80, sellingPrice: 75, discountPercentage: 6 },
      ],
    };

    render(<ProductCard product={product} />);

    fireEvent.click(screen.getByRole('button', { name: /select 250g unit/i }));
    expect(screen.getByText('₹40')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /increase quantity/i }));
    fireEvent.click(screen.getByRole('button', { name: /add rice/i }));

    expect(addItemMock).toHaveBeenCalledWith(product, 2, expect.objectContaining({ label: '250g' }));
  });
});
