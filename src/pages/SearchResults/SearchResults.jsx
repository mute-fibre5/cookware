import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useProducts } from '../../context/ProductContext';
import { ProductCard } from '../../components/ProductCard/ProductCard';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Search, X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import './SearchResults.css';

// Simple Levenshtein distance for "Did you mean"
function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
      else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

export function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { products } = useProducts();
  const { addToCart } = useCart();
  const { formatPrice, convertPrice } = useCurrency();
  const [results, setResults] = useState([]);
  const [didYouMean, setDidYouMean] = useState('');
  const [loading, setLoading] = useState(true);

  // Filters state
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const searchQuery = searchParams.get('q') || '';

  const brands = useMemo(() => {
    const b = new Set();
    products.forEach(p => p.brand && b.add(p.brand));
    return Array.from(b);
  }, [products]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        
        // Filter products
        let filtered = products.filter(product =>
          product.name.toLowerCase().includes(query) ||
          product.category_slug.toLowerCase().includes(query) ||
          (product.description && product.description.toLowerCase().includes(query)) ||
          (product.brand && product.brand.toLowerCase().includes(query))
        );

        // Apply deep filters
        filtered = filtered.filter(p => 
          p.price >= priceRange[0] && 
          p.price <= priceRange[1] &&
          (selectedBrands.length === 0 || selectedBrands.includes(p.brand))
        );

        setResults(filtered);

        // "Did you mean" logic
        if (filtered.length === 0) {
          let closest = '';
          let minDistance = 3;
          
          products.forEach(p => {
            const words = p.name.toLowerCase().split(' ');
            words.forEach(word => {
              const d = levenshtein(query, word);
              if (d < minDistance) {
                minDistance = d;
                closest = word;
              }
            });
          });

          if (closest && closest !== query) {
            setDidYouMean(closest);
          } else {
            setDidYouMean('');
          }
        } else {
          setDidYouMean('');
        }
      } else {
        setResults([]);
        setDidYouMean('');
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, products, priceRange, selectedBrands]);

  const clearSearch = () => {
    navigate('/');
  };

  const handleBrandToggle = (brand) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  return (
    <div className="search-results-page">
      <div className="search-header">
        <div className="search-header-content">
          <h1>
            <Search size={32} />
            Search Results
          </h1>
          <p className="search-query">
            {searchQuery ? `Results for "${searchQuery}"` : 'Enter a search term'}
          </p>
        </div>
        <button className="clear-search-btn" onClick={clearSearch}>
          <X size={20} />
        </button>
      </div>

      <div className="search-layout">
        <aside className={`search-filters ${showFilters ? 'mobile-visible' : ''}`}>
          <div className="filters-header" onClick={() => setShowFilters(!showFilters)}>
            <h3><Filter size={18} /> Filters</h3>
            {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          
          <div className={`filters-content ${showFilters ? 'show' : ''}`}>
            <div className="filter-group">
              <h4>Price Range (KSH)</h4>
              <div className="price-inputs">
                <input 
                  type="number" 
                  value={priceRange[0]} 
                  onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                />
                <span>-</span>
                <input 
                  type="number" 
                  value={priceRange[1]} 
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 0])}
                />
              </div>
            </div>

            {brands.length > 0 && (
              <div className="filter-group">
                <h4>Brands</h4>
                <div className="brand-list">
                  {brands.map(brand => (
                    <label key={brand} className="brand-item">
                      <input 
                        type="checkbox" 
                        checked={selectedBrands.includes(brand)}
                        onChange={() => handleBrandToggle(brand)}
                      />
                      <span>{brand}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className="search-container">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Searching products...</p>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="results-info">
                <p>Found <strong>{results.length}</strong> product{results.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="search-results-grid">
                {results.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="no-results">
              <Search size={48} />
              <h2>No products found</h2>
              <p>We couldn't find any products matching "{searchQuery}"</p>
              
              {didYouMean && (
                <div className="did-you-mean">
                  Did you mean: <button onClick={() => navigate(`/search?q=${didYouMean}`)}>{didYouMean}</button>?
                </div>
              )}

              <p>Try searching with different keywords or browse our categories</p>
              <button className="browse-btn" onClick={clearSearch}>
                Browse All Products
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
