export default function CategoryChips({ categories, selectedCategory, onCategorySelect }) {
  return (
    <nav aria-label="Product categories" className="px-3 xs:px-4 md:px-6 py-3 md:py-4 -mt-6 relative z-10">
      <div className="flex gap-2 xs:gap-3 overflow-x-auto scrollbar-none">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onCategorySelect?.(c.id)}
            className={`shrink-0 flex items-center gap-1 xs:gap-2 rounded-full px-3 xs:px-4 py-1.5 md:py-2 text-xs xs:text-sm font-medium transition-colors border shadow-card ${
              selectedCategory === c.id
                ? 'bg-leaf-500 text-white border-leaf-500 dark:bg-turmeric-500 dark:text-ink-900'
                : 'bg-white dark:bg-leaf-600/30 border border-leaf-100 dark:border-leaf-400/20 hover:border-leaf-400 text-ink-700 dark:text-rice-100'
            }`}
          >
            <span className="text-base xs:text-lg" aria-hidden="true">{c.icon}</span>
            <span className="hidden xs:inline">{c.name}</span>
            <span className="inline xs:hidden truncate max-w-[60px]">{c.name}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
