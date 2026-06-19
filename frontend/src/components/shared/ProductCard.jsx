import { Link } from 'react-router-dom';
import { HiOutlineBuildingStorefront } from 'react-icons/hi2';
import { formatCurrency, getImageUrl } from '../../utils/helpers';

export default function ProductCard({ product }) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="group block bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 ease-out"
    >
      {/* Image */}
      <div className="aspect-square overflow-hidden bg-surface-100">
        <img
          src={getImageUrl(product.image_url)}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 ease-out"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';
          }}
        />
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <HiOutlineBuildingStorefront className="text-surface-400 shrink-0" size={14} />
          <span className="text-xs text-surface-400 truncate">{product.store_name}</span>
        </div>

        <h3 className="text-sm font-semibold text-surface-800 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors duration-200 leading-snug min-h-[2.5rem]">
          {product.name}
        </h3>

        <p className="text-base font-bold text-primary-600">
          {formatCurrency(product.price)}
        </p>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-surface-400">
            Stock: {product.stock}
          </span>
        </div>
      </div>
    </Link>
  );
}
