import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Edit2, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useProducts } from '../context/ProductsContext.jsx';

const OWNER_EMAIL = 'owner@selvammaligai.store';
const CATEGORIES = [
  { id: 'c1', slug: 'rice-grains', name: 'Rice & Grains' },
  { id: 'c2', slug: 'dals-pulses', name: 'Dals & Pulses' },
  { id: 'c3', slug: 'spices-masalas', name: 'Spices & Masalas' },
  { id: 'c4', slug: 'oils-ghee', name: 'Oils & Ghee' },
  { id: 'c9', slug: 'stationery', name: 'Stationery' },
  { id: 'c10', slug: 'tea-coffee', name: 'Tea & Coffee' },
  { id: 'c11', slug: 'toilet-cleaner', name: 'Toilet Cleaner' },
  { id: 'c12', slug: 'pooja-products', name: 'Pooja Products' },
  { id: 'c13', slug: 'fancy-products', name: 'Fancy Products' },
  { id: 'c15', slug: 'home-cleaner', name: 'Home Cleaner' },
  { id: 'c16', slug: 'napkins', name: 'Napkins' },
  { id: 'c17', slug: 'detergent-oil', name: 'Detergent Liquid & Powder' },
  { id: 'c18', slug: 'soap', name: 'Soap' },
  { id: 'c19', slug: 'shampoo', name: 'Shampoo' },
  { id: 'c20', slug: 'paste-brush', name: 'Paste & Brush' },
  { id: 'c21', slug: 'maavu-noodles', name: 'Maavu & Noodles' },
];

export default function ProductManager() {
  const { user, isAuthenticated } = useAuth();
  const { products, updateProduct, addProduct, deleteProduct } = useProducts();
  const isOwner = user?.email === OWNER_EMAIL;
  
  const [mode, setMode] = useState('view'); // view, add, edit
  const [selectedId, setSelectedId] = useState(products[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const selectedProduct = products.find((p) => p.id === selectedId) || products[0];

  const [form, setForm] = useState({
    name: '',
    category: 'c1',
    image: '🍚',
    imageFile: null,
    mrp: '',
    sellingPrice: '',
    discount: '',
    unit: '',
    stockStatus: 'in_stock',
    variants: [],
  });

  useEffect(() => {
    if (mode === 'edit' && selectedProduct) {
      const categoryId = CATEGORIES.find((c) => c.slug === selectedProduct.category || c.id === selectedProduct.category)?.id;
      setForm({
        name: selectedProduct.name,
        category: categoryId || selectedProduct.category,
        image: selectedProduct.image,
        mrp: selectedProduct.mrp,
        sellingPrice: selectedProduct.sellingPrice,
        discount: selectedProduct.discountPercentage,
        unit: selectedProduct.unit,
        stockStatus: selectedProduct.stockStatus,
        variants: Array.isArray(selectedProduct.variants) ? selectedProduct.variants : [],
      });
    } else if (mode === 'add') {
      setForm({
        name: '',
        category: 'c1',
        image: '🍚',
        imageFile: null,
        mrp: '',
        sellingPrice: '',
        discount: '',
        unit: '',
        stockStatus: 'in_stock',
        variants: [],
      });
    }
  }, [mode, selectedProduct]);

  useEffect(() => {
    const mrp = Number(form.mrp);
    const sellingPrice = Number(form.sellingPrice);

    if (!Number.isFinite(mrp) || mrp <= 0 || !Number.isFinite(sellingPrice)) return;

    const calculated = Math.max(0, Math.round(((mrp - sellingPrice) / mrp) * 100));
    if (Number(form.discount) !== calculated) {
      setForm((prev) => ({ ...prev, discount: calculated }));
    }
  }, [form.mrp, form.sellingPrice]);

  useEffect(() => {
    setForm((prev) => {
      const nextVariants = prev.variants.map((variant) => {
        const mrp = Number(variant.mrp);
        const sellingPrice = Number(variant.sellingPrice);

        if (!Number.isFinite(mrp) || mrp <= 0 || !Number.isFinite(sellingPrice)) {
          return variant;
        }

        const calculated = Math.max(0, Math.round(((mrp - sellingPrice) / mrp) * 100));
        const currentDiscount = Number(variant.discountPercentage);
        if (!Number.isFinite(currentDiscount) || currentDiscount === calculated) {
          return { ...variant, discountPercentage: calculated };
        }

        return variant;
      });

      const needsUpdate = nextVariants.some((variant, index) => {
        const current = prev.variants[index] || {};
        return variant.discountPercentage !== current.discountPercentage;
      });

      return needsUpdate ? { ...prev, variants: nextVariants } : prev;
    });
  }, [form.variants]);

  const filteredProducts = products.filter((product) => {
    const lowerSearch = searchTerm.trim().toLowerCase();
    if (!lowerSearch) return true;

    const category = CATEGORIES.find((c) => c.id === product.category || c.slug === product.category);
    const variantLabels = Array.isArray(product.variants)
      ? product.variants.map((variant) => variant.label).filter(Boolean)
      : [];

    return [
      product.name,
      category?.name,
      product.unit,
      ...variantLabels,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(lowerSearch);
  });

  const updateVariant = (index, key, value) => {
    setForm((prev) => {
      const variants = [...prev.variants];
      variants[index] = { ...variants[index], [key]: value };
      return { ...prev, variants };
    });
  };

  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { label: '', mrp: '', sellingPrice: '' }],
    }));
  };

  const removeVariant = (index) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, idx) => idx !== index),
    }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!form.name || !form.mrp || !form.sellingPrice || !form.unit) {
      setMessage({ type: 'error', text: 'Please fill all required fields.' });
      return;
    }

    try {
      const id = await addProduct({
        name: form.name,
        category: form.category,
        image: form.imageFile || form.image,
        mrp: Number(form.mrp),
        sellingPrice: Number(form.sellingPrice),
        discountPercentage: form.discount ? Number(form.discount) : null,
        unit: form.unit,
        stockStatus: form.stockStatus,
        variants: form.variants
          .filter((variant) => variant.label && variant.mrp && variant.sellingPrice)
          .map((variant) => ({
            label: variant.label,
            mrp: Number(variant.mrp),
            sellingPrice: Number(variant.sellingPrice),
            discountPercentage: variant.discountPercentage
              ? Number(variant.discountPercentage)
              : Math.max(0, Math.round(((Number(variant.mrp) - Number(variant.sellingPrice)) / Number(variant.mrp)) * 100)),
          })),
      });
      setMessage({ type: 'success', text: 'Product added successfully!' });
      setSelectedId(id);
      setMode('view');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Unable to save product.' });
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    const productId = selectedProduct?.id || selectedId || '';

    if (!productId || !form.name || !form.mrp || !form.sellingPrice || !form.unit) {
      setMessage({ type: 'error', text: 'Please fill all required fields.' });
      return;
    }

    try {
      setMessage({ type: 'info', text: 'Updating product...' });
      const updatedProduct = await updateProduct({
        id: productId,
        name: form.name,
        category: form.category,
        image: form.imageFile || form.image,
        mrp: Number(form.mrp),
        sellingPrice: Number(form.sellingPrice),
        discountPercentage: form.discount ? Number(form.discount) : null,
        unit: form.unit,
        stockStatus: form.stockStatus,
        variants: form.variants
          .filter((variant) => variant.label && variant.mrp && variant.sellingPrice)
          .map((variant) => ({
            label: variant.label,
            mrp: Number(variant.mrp),
            sellingPrice: Number(variant.sellingPrice),
            discountPercentage: variant.discountPercentage
              ? Number(variant.discountPercentage)
              : Math.max(0, Math.round(((Number(variant.mrp) - Number(variant.sellingPrice)) / Number(variant.mrp)) * 100)),
          })),
      });

      if (updatedProduct?.id) {
        setSelectedId(updatedProduct.id);
      } else {
        setSelectedId(productId);
      }

      setMessage({ type: 'success', text: 'Product updated successfully!' });
      setMode('view');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Unable to update product.' });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_IMAGE_MB = 2;
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setMessage({
        type: 'error',
        text: `Image is too large (max ${MAX_IMAGE_MB}MB). Please choose a smaller photo, or use the emoji fallback instead.`,
      });
      e.target.value = '';
      return;
    }

    // Resize + re-compress on the client before it ever becomes base64 text
    // that gets stored inline in the MongoDB document. Uncompressed phone
    // photos (2-8MB) were bloating documents enough that a handful of real
    // products blew past MongoDB's 32MB in-memory sort limit on the product
    // list query, and were burning through Atlas's free-tier storage quota.
    // A resized JPEG here is typically 20-80KB instead of several MB.
    const MAX_DIMENSION = 800;
    const JPEG_QUALITY = 0.72;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        setForm((f) => ({ ...f, imageFile: compressed }));
      };
      img.onerror = () => {
        // Fall back to the original file if it somehow isn't a decodable image
        setForm((f) => ({ ...f, imageFile: event.target?.result }));
      };
      img.src = event.target?.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteProduct = async () => {
    try {
      await deleteProduct(deleteConfirm);
      setMessage({ type: 'success', text: 'Product deleted successfully!' });
      setDeleteConfirm(null);
      setSelectedId(products.find((product) => product.id !== deleteConfirm)?.id || '');
      setMode('view');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Unable to delete product.' });
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-[70vh] grid place-items-center px-4 py-16">
        <div className="max-w-md rounded-card bg-white dark:bg-leaf-600/20 border border-leaf-100/60 dark:border-leaf-400/10 shadow-soft p-8 text-center">
          <h1 className="font-display font-bold text-2xl text-leaf-500 dark:text-turmeric-100">Owner access required</h1>
          <p className="mt-4 text-sm text-ink-500 dark:text-rice-200/70">
            Please log in with the shop owner account to manage products.
          </p>
          <Link to="/" className="inline-flex mt-6 rounded-full bg-leaf-500 hover:bg-leaf-400 text-white font-semibold px-6 py-3 transition-colors">
            Log in
          </Link>
        </div>
      </main>
    );
  }

  if (!isOwner) {
    return (
      <main className="min-h-[70vh] grid place-items-center px-4 py-16">
        <div className="max-w-md rounded-card bg-white dark:bg-leaf-600/20 border border-leaf-100/60 dark:border-leaf-400/10 shadow-soft p-8 text-center">
          <h1 className="font-display font-bold text-2xl text-leaf-500 dark:text-turmeric-100">Access denied</h1>
          <p className="mt-4 text-sm text-ink-500 dark:text-rice-200/70">
            Only the shop owner can manage products.
          </p>
          <p className="mt-3 text-xs text-ink-500 dark:text-rice-200/60">
            Log in as <strong>{OWNER_EMAIL}</strong> to access this page.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[70vh] px-4 py-10 lg:px-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl text-leaf-500 dark:text-turmeric-100">Product Manager</h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-rice-200/70">Add, edit, or delete products from your store</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-leaf-100 dark:border-leaf-400/10">
          <button
            onClick={() => setMode('view')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              mode === 'view'
                ? 'border-leaf-500 text-leaf-500 dark:text-turmeric-100'
                : 'border-transparent text-ink-500 dark:text-rice-200/70 hover:text-leaf-500'
            }`}
          >
            <Eye className="inline mr-2" size={18} />
            View Products
          </button>
          <button
            onClick={() => setMode('add')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              mode === 'add'
                ? 'border-leaf-500 text-leaf-500 dark:text-turmeric-100'
                : 'border-transparent text-ink-500 dark:text-rice-200/70 hover:text-leaf-500'
            }`}
          >
            <Plus className="inline mr-2" size={18} />
            Add Product
          </button>
          <button
            onClick={() => setMode('edit')}
            disabled={!selectedProduct}
            className={`px-4 py-3 font-medium transition-colors border-b-2 disabled:opacity-50 ${
              mode === 'edit'
                ? 'border-leaf-500 text-leaf-500 dark:text-turmeric-100'
                : 'border-transparent text-ink-500 dark:text-rice-200/70 hover:text-leaf-500'
            }`}
          >
            <Edit2 className="inline mr-2" size={18} />
            Edit Selected
          </button>
        </div>

        {/* Messages */}
        {message.text && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-leaf-50 dark:bg-leaf-900/40 border border-leaf-200 text-leaf-800 dark:text-leaf-100'
              : 'bg-kumkum-50 dark:bg-kumkum-900/40 border border-kumkum-200 text-kumkum-800 dark:text-kumkum-100'
          }`}>
            {message.text}
          </div>
        )}

        {/* Content */}
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          {/* Products List */}
          <div className="rounded-card bg-white dark:bg-leaf-600/20 border border-leaf-100/60 dark:border-leaf-400/10 shadow-soft p-6 h-fit">
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-leaf-500">Products ({filteredProducts.length})</h2>
                <button
                  type="button"
                  onClick={() => {
                    setMode('add');
                    setSelectedId('');
                  }}
                  className="rounded-full bg-leaf-500 text-white px-4 py-2 text-sm font-semibold hover:bg-leaf-400 transition-colors"
                >
                  Add new
                </button>
              </div>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products by name, unit, or variant"
                className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-sm outline-none focus:border-leaf-400"
              />
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <p className="text-xs xs:text-sm text-ink-500 dark:text-rice-200/70 text-center py-10">
                  No products match your search.
                </p>
              ) : (
                filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(product.id);
                      setMode('edit');
                    }}
                    className={selectedId === product.id
                      ? 'w-full text-left rounded-xl px-3 py-2 border transition text-sm flex gap-2 items-start border-leaf-500 bg-leaf-50 dark:bg-leaf-700/40'
                      : 'w-full text-left rounded-xl px-3 py-2 border transition text-sm flex gap-2 items-start border-leaf-100 bg-white dark:bg-leaf-900/40 hover:bg-leaf-50 dark:hover:bg-leaf-900/60'}
                  >
                    <div className="w-8 h-8 rounded-lg bg-rice-200 dark:bg-leaf-600/30 flex-shrink-0 grid place-items-center text-sm overflow-hidden">
                      {typeof product.image === 'string' && product.image.startsWith('data:image') ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{product.image}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{product.name}</div>
                      <div className="text-xs text-ink-500 dark:text-rice-200/70">₹{product.sellingPrice}</div>
                    </div>
                  </button>
                )))}

            </div>
          </div>

          {/* Forms */}
          <div className="rounded-card bg-white dark:bg-leaf-600/20 border border-leaf-100/60 dark:border-leaf-400/10 shadow-soft p-6">
            {mode === 'view' && selectedProduct && (
              <div className="space-y-6">
                <div className="w-full h-48 mb-4 rounded-lg bg-rice-200 dark:bg-leaf-900/40 overflow-hidden flex items-center justify-center">
                  {typeof selectedProduct.image === 'string' && selectedProduct.image.startsWith('data:image') ? (
                    <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl">{selectedProduct.image}</span>
                  )}
                </div>
                <div className="grid gap-4">
                  <div>
                    <label className="text-xs font-semibold text-ink-500 dark:text-rice-200/70">Product Name</label>
                    <p className="text-lg font-semibold text-ink-900 dark:text-rice-100">{selectedProduct.name}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-500 dark:text-rice-200/70">Category</label>
                    <p className="text-ink-900 dark:text-rice-100">{CATEGORIES.find((c) => c.id === selectedProduct.category || c.slug === selectedProduct.category)?.name || selectedProduct.category}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-ink-500 dark:text-rice-200/70">MRP</label>
                      <p className="text-ink-900 dark:text-rice-100">₹{selectedProduct.mrp}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-ink-500 dark:text-rice-200/70">Selling Price</label>
                      <p className="text-leaf-600 dark:text-turmeric-200 font-semibold">₹{selectedProduct.sellingPrice}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-ink-500 dark:text-rice-200/70">Unit</label>
                      <p className="text-ink-900 dark:text-rice-100">{selectedProduct.unit}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-ink-500 dark:text-rice-200/70">Stock Status</label>
                      <p className={`font-semibold ${
                        selectedProduct.stockStatus === 'in_stock' ? 'text-leaf-600' :
                        selectedProduct.stockStatus === 'low_stock' ? 'text-turmeric-600' : 'text-kumkum-600'
                      }`}>
                        {selectedProduct.stockStatus === 'in_stock' ? 'In Stock' : 
                         selectedProduct.stockStatus === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-500 dark:text-rice-200/70">Discount</label>
                    <p className="text-ink-900 dark:text-rice-100">{selectedProduct.discountPercentage}%</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setMode('edit')}
                    className="flex-1 rounded-full bg-leaf-500 hover:bg-leaf-400 text-white font-semibold py-3 transition-colors"
                  >
                    Edit Product
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(selectedProduct.id)}
                    className="px-6 rounded-full bg-kumkum-500 hover:bg-kumkum-400 text-white font-semibold py-3 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            )}

            {mode === 'add' && (
              <form onSubmit={handleAddProduct} className="space-y-4">
                <h2 className="font-semibold text-lg text-leaf-500 mb-4">Add New Product</h2>

                <div>
                  <label className="block text-sm font-medium text-ink-900 dark:text-rice-100 mb-1">Product name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-sm outline-none focus:border-leaf-400"
                    placeholder="e.g., Ponni Boiled Rice"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-900 dark:text-rice-100 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-sm outline-none focus:border-leaf-400"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-900 dark:text-rice-100 mb-1">Product Image</label>
                  <div className="space-y-3">
                    <div className="w-full h-40 rounded-lg bg-rice-200 dark:bg-leaf-900/40 overflow-hidden flex items-center justify-center border-2 border-dashed border-leaf-200 dark:border-leaf-400/30">
                      {form.imageFile ? (
                        <img src={form.imageFile} alt="Preview" className="w-full h-full object-cover" />
                      ) : typeof form.image === 'string' && form.image.startsWith('data:image') ? (
                        <img src={form.image} alt="Current" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">{form.image}</span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-sm outline-none focus:border-leaf-400"
                    />
                    <p className="text-xs text-ink-500 dark:text-rice-200/70">Or use emoji as fallback:</p>
                    <input
                      value={form.image && !form.image.startsWith('data:image') ? form.image : '🍚'}
                      onChange={(e) => setForm(f => ({ ...f, image: e.target.value }))}
                      maxLength="2"
                      className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-lg outline-none focus:border-leaf-400"
                      placeholder="🍚"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-ink-900 dark:text-rice-100 mb-1">MRP *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.mrp}
                      onChange={(e) => setForm(f => ({ ...f, mrp: e.target.value }))}
                      className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-sm outline-none focus:border-leaf-400"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-900 dark:text-rice-100 mb-1">Selling Price *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.sellingPrice}
                      onChange={(e) => setForm(f => ({ ...f, sellingPrice: e.target.value }))}
                      className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-sm outline-none focus:border-leaf-400"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-900 dark:text-rice-100 mb-1">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.discount}
                    onChange={(e) => setForm(f => ({ ...f, discount: e.target.value }))}
                    className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-sm outline-none focus:border-leaf-400"
                    placeholder="e.g., 10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-900 dark:text-rice-100 mb-1">Unit *</label>
                  <input
                    required
                    value={form.unit}
                    onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))}
                    className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-sm outline-none focus:border-leaf-400"
                    placeholder="e.g., 10 kg, 500 g"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-ink-900 dark:text-rice-100">Additional unit & price options</label>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="text-xs font-semibold text-leaf-500 hover:text-leaf-600"
                    >
                      + Add option
                    </button>
                  </div>
                  <div className="space-y-3">
                    {form.variants.length === 0 ? (
                      <p className="text-xs text-ink-500 dark:text-rice-200/70">Add extra units such as 1kg, 200g, or 500g with their own price and discount.</p>
                    ) : (
                      form.variants.map((variant, index) => (
                        <div key={`variant-row-${index}`} className="grid gap-2 sm:grid-cols-[1.2fr_0.9fr_0.9fr_0.8fr_auto] items-end">
                          <label className="sr-only">Unit label</label>
                          <input
                            value={variant.label}
                            onChange={(e) => updateVariant(index, 'label', e.target.value)}
                            placeholder="Unit (e.g. 1kg)"
                            className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-sm outline-none focus:border-leaf-400"
                          />
                          <label className="sr-only">MRP</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.mrp}
                            onChange={(e) => updateVariant(index, 'mrp', e.target.value)}
                            placeholder="MRP"
                            className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-sm outline-none focus:border-leaf-400"
                          />
                          <label className="sr-only">Sell price</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.sellingPrice}
                            onChange={(e) => updateVariant(index, 'sellingPrice', e.target.value)}
                            placeholder="Price"
                            className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-sm outline-none focus:border-leaf-400"
                          />
                          <label className="sr-only">Discount</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={variant.discountPercentage ?? ''}
                            onChange={(e) => updateVariant(index, 'discountPercentage', e.target.value)}
                            placeholder="%"
                            className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-sm outline-none focus:border-leaf-400"
                          />
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="rounded-full bg-kumkum-500 hover:bg-kumkum-400 text-white px-3 py-2 text-xs font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-900 dark:text-rice-100 mb-1">Stock Status</label>
                  <select
                    value={form.stockStatus}
                    onChange={(e) => setForm(f => ({ ...f, stockStatus: e.target.value }))}
                    className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-sm outline-none focus:border-leaf-400"
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-full bg-leaf-500 hover:bg-leaf-400 text-white font-semibold py-3 transition-colors mt-6"
                >
                  Add Product
                </button>
              </form>
            )}

            {mode === 'edit' && selectedProduct && (
              <form onSubmit={handleUpdateProduct} className="space-y-4">
                <h2 className="font-semibold text-lg text-leaf-500 mb-4">Edit Product</h2>

                <div>
                  <label className="block text-sm font-medium text-ink-900 dark:text-rice-100 mb-1">Product name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-sm outline-none focus:border-leaf-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-900 dark:text-rice-100 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-sm outline-none focus:border-leaf-400"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-900 dark:text-rice-100 mb-1">Product Image</label>
                  <div className="space-y-3">
                    <div className="w-full h-40 rounded-lg bg-rice-200 dark:bg-leaf-900/40 overflow-hidden flex items-center justify-center border-2 border-dashed border-leaf-200 dark:border-leaf-400/30">
                      {form.imageFile ? (
                        <img src={form.imageFile} alt="Preview" className="w-full h-full object-cover" />
                      ) : typeof form.image === 'string' && form.image.startsWith('data:image') ? (
                        <img src={form.image} alt="Current" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">{form.image}</span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-sm outline-none focus:border-leaf-400"
                    />
                    <p className="text-xs text-ink-500 dark:text-rice-200/70">Or use emoji as fallback:</p>
                    <input
                      value={form.image && !form.image.startsWith('data:image') ? form.image : '🍚'}
                      onChange={(e) => setForm(f => ({ ...f, image: e.target.value }))}
                      maxLength="2"
                      className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-lg outline-none focus:border-leaf-400"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-ink-900 dark:text-rice-100 mb-1">MRP *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.mrp}
                      onChange={(e) => setForm(f => ({ ...f, mrp: e.target.value }))}
                      className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-sm outline-none focus:border-leaf-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-900 dark:text-rice-100 mb-1">Selling Price *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.sellingPrice}
                      onChange={(e) => setForm(f => ({ ...f, sellingPrice: e.target.value }))}
                      className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-sm outline-none focus:border-leaf-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-900 dark:text-rice-100 mb-1">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.discount}
                    onChange={(e) => setForm(f => ({ ...f, discount: e.target.value }))}
                    className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-sm outline-none focus:border-leaf-400"
                    placeholder="e.g., 10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-900 dark:text-rice-100 mb-1">Unit *</label>
                  <input
                    required
                    value={form.unit}
                    onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))}
                    className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-sm outline-none focus:border-leaf-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-ink-900 dark:text-rice-100">Additional unit & price options</label>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="text-xs font-semibold text-leaf-500 hover:text-leaf-600"
                    >
                      + Add option
                    </button>
                  </div>
                  <div className="space-y-3">
                    {form.variants.length === 0 ? (
                      <p className="text-xs text-ink-500 dark:text-rice-200/70">Add extra units such as 1kg, 200g, or 500g with their own price and discount.</p>
                    ) : (
                      form.variants.map((variant, index) => (
                        <div key={`variant-row-${index}`} className="grid gap-2 sm:grid-cols-[1.2fr_0.9fr_0.9fr_0.8fr_auto] items-end">
                          <label className="sr-only">Unit label</label>
                          <input
                            value={variant.label}
                            onChange={(e) => updateVariant(index, 'label', e.target.value)}
                            placeholder="Unit (e.g. 1kg)"
                            className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-sm outline-none focus:border-leaf-400"
                          />
                          <label className="sr-only">MRP</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.mrp}
                            onChange={(e) => updateVariant(index, 'mrp', e.target.value)}
                            placeholder="MRP"
                            className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-sm outline-none focus:border-leaf-400"
                          />
                          <label className="sr-only">Sell price</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.sellingPrice}
                            onChange={(e) => updateVariant(index, 'sellingPrice', e.target.value)}
                            placeholder="Price"
                            className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-sm outline-none focus:border-leaf-400"
                          />
                          <label className="sr-only">Discount</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={variant.discountPercentage ?? ''}
                            onChange={(e) => updateVariant(index, 'discountPercentage', e.target.value)}
                            placeholder="%"
                            className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-sm outline-none focus:border-leaf-400"
                          />
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="rounded-full bg-kumkum-500 hover:bg-kumkum-400 text-white px-3 py-2 text-xs font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-900 dark:text-rice-100 mb-1">Stock Status</label>
                  <select
                    value={form.stockStatus}
                    onChange={(e) => setForm(f => ({ ...f, stockStatus: e.target.value }))}
                    className="w-full rounded-lg border border-leaf-100 bg-rice-50 dark:bg-leaf-900/40 px-3 py-2 text-sm outline-none focus:border-leaf-400"
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-6">
                  <button
                    type="submit"
                    className="flex-1 rounded-full bg-leaf-500 hover:bg-leaf-400 text-white font-semibold py-3 transition-colors"
                  >
                    Update Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(selectedProduct.id)}
                    className="px-6 rounded-full bg-kumkum-500 hover:bg-kumkum-400 text-white font-semibold py-3 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/40 z-50 grid place-items-center p-4">
            <div className="rounded-card bg-white dark:bg-leaf-600/20 border border-leaf-100/60 dark:border-leaf-400/10 shadow-soft p-6 max-w-md">
              <h3 className="font-display font-bold text-lg text-kumkum-600 dark:text-kumkum-300">Delete product?</h3>
              <p className="mt-2 text-sm text-ink-600 dark:text-rice-200">
                Are you sure you want to delete <strong>{products.find(p => p.id === deleteConfirm)?.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 rounded-full border border-leaf-200 text-leaf-600 font-semibold py-2 hover:bg-leaf-50 dark:hover:bg-leaf-900/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProduct}
                  className="flex-1 rounded-full bg-kumkum-500 hover:bg-kumkum-400 text-white font-semibold py-2 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
