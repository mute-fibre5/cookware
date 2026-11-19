import { Link } from 'react-router-dom';
import { Package, AlertCircle } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import './ProductCard.css';

/**
 * ProductCard Component
 * Displays product information in a card layout with link to detail page
 * @param {Object} product - Product object with id, name, price, image_url, category_slug, in_stock
 */
export function ProductCard({ product }) {
  const { formatPrice } = useCurrency();
  const handleImageError = (e) => {
    e.target.src = '/placeholders/image-placeholder.svg';
  };

  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= (product.low_stock_threshold || 5);

  return (
    <Link 
      to={`/product/${product.id}`}
      className="product-card"
      aria-label={`View details for ${product.name}`}
    >
      <div className="product-image">
        <img 
          src={product.image_url} 
          alt={product.name}
          loading="lazy"
          onError={handleImageError}
        />
        {isLowStock && (
          <div className="low-stock-tag">
            <AlertCircle size={14} />
            <span>Only {product.stock_quantity} left</span>
          </div>
        )}
      </div>
      
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        
        <div className="product-meta">
          <span className="category-badge">{product.category_slug}</span>
          {product.stock_quantity > 0 ? (
            <span className="stock-badge in-stock">In Stock</span>
          ) : (
            <span className="stock-badge out-of-stock">Out of Stock</span>
          )}
        </div>

        <p className="product-price">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}