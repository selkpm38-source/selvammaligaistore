import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductsProvider, useProducts } from '../ProductsContext.jsx';

const mockPut = vi.fn();
const mockGet = vi.fn();

vi.mock('../../api/axiosClient.js', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    put: (...args) => mockPut(...args),
    post: vi.fn(),
    delete: vi.fn(),
  },
  setAccessToken: vi.fn(),
}));

describe('ProductsContext updateProduct', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPut.mockReset();
    mockGet.mockResolvedValue({ data: { data: [] } });
  });

  it('rejects when the backend update fails', async () => {
    mockPut.mockRejectedValueOnce(new Error('backend update failed'));

    const wrapper = ({ children }) => <ProductsProvider>{children}</ProductsProvider>;
    const { result } = renderHook(() => useProducts(), { wrapper });

    await waitFor(() => {
      expect(result.current.products).toBeDefined();
    });

    await expect(
      result.current.updateProduct({
        id: 'p1',
        name: 'Test Product',
        category: 'c1',
        mrp: 100,
        sellingPrice: 90,
        unit: '1 kg',
      })
    ).rejects.toThrow('backend update failed');
  });
});
