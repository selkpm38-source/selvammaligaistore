import { motion } from 'framer-motion';
import { Star, Plus, Minus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext.jsx';

const buildUnitOptions = (product) => {
  const baseOption = {
    label: product.unit || 'Unit',
    mrp: Number(product.mrp || 0),
    sellingPrice: Number(product.sellingPrice || 0),
    discountPercentage: Number(product.discountPercentage || 0),
    isDefault: true,
  };

  const options = [baseOption];

  if (Array.isArray(product.variants) && product.variants.length > 0) {
    product.variants.forEach((variant) => {
      if (!variant?.label) return;
      options.push({
        label: variant.label,
        mrp: Number(variant.mrp || 0),
        sellingPrice: Number(variant.sellingPrice || 0),
        discountPercentage: Number(variant.discountPercentage || 0),
      });
    });
  }

  return options.filter((option) => option?.label);
};

export default function ProductCard({ product, isSelected = false }) {
  const { addItem } = useCart();
  const [selectedUnit, setSelectedUnit] = useState(() => buildUnitOptions(product)[0] ?? null);
  const [quantity, setQuantity] = useState(1);
  const unitOptions = buildUnitOptions(product);
  const selectedOption = unitOptions.find((option) => option.label === selectedUnit?.label && option.sellingPrice === selectedUnit?.sellingPrice) || unitOptions[0] || null;
  const displayUnit = selectedOption?.label || product.unit || '';
  const displayPrice = selectedOption?.sellingPrice ?? product.sellingPrice;
  const displayMrp = selectedOption?.mrp ?? product.mrp;
  const displayDiscount = selectedOption?.discountPercentage ?? product.discountPercentage;

  useEffect(() => {
    setSelectedUnit(buildUnitOptions(product)[0] ?? null);
    setQuantity(1);
  }, [product.id, product.unit, product.mrp, product.sellingPrice, product.discountPercentage, JSON.stringify(product.variants || [])]);

  return (
    <motion.article
      id={`product-${product.id}`}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative w-40 xs:w-44 sm:w-52 shrink-0 rounded-card bg-white dark:bg-leaf-600/20 shadow-card border border-leaf-100/60 dark:border-leaf-400/10 overflow-hidden ${isSelected ? 'ring-2 ring-leaf-500 ring-offset-2 dark:ring-turmeric-400' : ''}`}
    >
      {displayDiscount > 0 && (
        <span className="absolute top-1.5 left-1.5 z-10 rounded-full bg-kumkum-500 text-white text-[10px] xs:text-[11px] font-semibold px-2 py-0.5">
          {displayDiscount}% OFF
        </span>
      )}

      <div className="grid place-items-center h-24 xs:h-28 sm:h-32 bg-rice-200 dark:bg-leaf-900/40 overflow-hidden">
        {typeof product.image === 'string' && product.image.startsWith('data:image') ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl xs:text-5xl">{product.image}</span>
        )}
      </div>

      <div className="p-2 xs:p-3">
        <h3 className="text-xs xs:text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
        <p className="text-xs text-ink-500 dark:text-rice-200/70 mt-0.5">{displayUnit}</p>

        {unitOptions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {unitOptions.map((option) => (
              <button
                key={`${option.label}-${option.sellingPrice}`}
                type="button"
                aria-label={`Select ${option.label} unit`}
                onClick={() => setSelectedUnit(option)}
                className={`text-[10px] xs:text-[11px] rounded-full px-2 py-1 border transition ${
                  selectedOption?.label === option.label && selectedOption?.sellingPrice === option.sellingPrice
                    ? 'bg-leaf-500 text-white border-leaf-500'
                    : 'bg-white dark:bg-leaf-600/30 border-leaf-100 dark:border-leaf-400/20 text-ink-600 dark:text-rice-200 hover:bg-leaf-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 mt-1 text-xs text-ink-500 dark:text-rice-200/70">
          <Star size={12} className="fill-turmeric-500 text-turmeric-500" />
          {product.rating} ({product.ratingCount})
        </div>

        <div className="flex items-end justify-between mt-2 gap-1">
          <div className="flex-1">
            <p className="price text-xs xs:text-sm font-semibold text-leaf-500 dark:text-turmeric-100">
              ₹{displayPrice}
            </p>
            {displayMrp !== displayPrice && (
              <p className="price text-[10px] xs:text-xs text-ink-500 line-through">₹{displayMrp}</p>
            )}
            <a
              href="https://wa.me/919345786927?text=Hi%2C%20I%20would%20like%20to%20know%20the%20wholesale%20price."
              target="_blank"
              rel="noreferrer"
              className="mt-1 block text-[9px] xs:text-[10px] leading-tight text-leaf-600 dark:text-turmeric-100 hover:underline"
            >
              Retail price · WhatsApp for wholesale
            </a>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-leaf-100 dark:border-leaf-400/20 bg-white/80 dark:bg-leaf-900/40 px-2 py-1">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                aria-label="Decrease quantity"
                className="grid place-items-center w-5 h-5 rounded-full bg-leaf-50 dark:bg-leaf-800 text-leaf-600"
              >
                <Minus size={12} />
              </button>
              <span className="min-w-4 text-center text-[11px] font-semibold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((value) => value + 1)}
                aria-label="Increase quantity"
                className="grid place-items-center w-5 h-5 rounded-full bg-leaf-50 dark:bg-leaf-800 text-leaf-600"
              >
                <Plus size={12} />
              </button>
            </div>
            <button
              onClick={() => addItem(product, quantity, selectedOption)}
              aria-label={`Add ${product.name}${selectedOption ? ` (${selectedOption.label})` : ''} to cart`}
              className="grid place-items-center w-7 xs:w-8 h-7 xs:h-8 rounded-full bg-leaf-500 text-white hover:bg-leaf-400 active:scale-95 transition flex-shrink-0"
            >
              <Plus size={14} className="xs:hidden" />
              <Plus size={16} className="hidden xs:block" />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
