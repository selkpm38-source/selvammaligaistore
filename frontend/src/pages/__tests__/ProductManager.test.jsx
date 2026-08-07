import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProductManager from '../ProductManager.jsx';

const mockUseAuth = vi.fn();
const mockUseProducts = vi.fn();
const updateProduct = vi.fn();

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../context/ProductsContext.jsx', () => ({
  useProducts: () => mockUseProducts(),
}));

describe('ProductManager variant inputs', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { email: 'owner@selvammaligai.store' },
      isAuthenticated: true,
    });
    updateProduct.mockReset();
    updateProduct.mockResolvedValue({ id: 'p1', name: 'Ponni Boiled Rice' });
    mockUseProducts.mockReturnValue({
      products: [{ id: 'p1', name: 'Ponni Boiled Rice', category: 'c1', image: '🍚', mrp: 600, sellingPrice: 550, discountPercentage: 8, unit: '10 kg', stockStatus: 'in_stock', variants: [] }],
      updateProduct,
      addProduct: vi.fn(),
      deleteProduct: vi.fn(),
    });
  });

  it('keeps the unit input mounted while typing into an added variant row', async () => {
    render(
      <MemoryRouter>
        <ProductManager />
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole('button', { name: /add product/i }));
    await userEvent.click(screen.getByRole('button', { name: /\+ add option/i }));

    const input = screen.getByPlaceholderText('Unit (e.g. 1kg)');
    const beforeNode = input;

    await userEvent.type(input, '1kg');

    const afterNode = screen.getByPlaceholderText('Unit (e.g. 1kg)');
    expect(afterNode).toBe(beforeNode);
    expect(afterNode.value).toBe('1kg');
  });

  it('shows a success message after updating a product', async () => {
    render(
      <MemoryRouter>
        <ProductManager />
      </MemoryRouter>
    );

    const productButtons = screen.getAllByRole('button', { name: /ponni boiled rice/i });
    await userEvent.click(productButtons[0]);
    await userEvent.click(screen.getByRole('button', { name: /update product/i }));

    expect(await screen.findByText('Product updated successfully!')).toBeTruthy();
  });
});
