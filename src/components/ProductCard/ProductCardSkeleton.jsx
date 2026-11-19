import './ProductCardSkeleton.css';

export function ProductCardSkeleton() {
  return (
    <div className="product-card-skeleton">
      <div className="skeleton-image"></div>
      <div className="skeleton-text"></div>
      <div className="skeleton-text short"></div>
      <div className="skeleton-price"></div>
    </div>
  );
}
