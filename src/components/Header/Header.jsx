import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, ChevronDown, Menu, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useProducts } from '../../context/ProductContext';
import { useState, useRef, useEffect } from 'react';
import { useMobile } from '../../hooks/useMobile';
import { supabase } from '../../utils/supabaseClient';
import { ADMIN_EMAIL } from '../../utils/constants';
import './Header.css';

const categories = [
  ['cookware', 'Cookware'],
  ['knives', 'Knives'],
  ['plates', 'Plates'],
  ['cups', 'Cups'],
  ['glasses', 'Glasses'],
  ['fancyplastic', 'Fancy Plastic'],
  ['kitchenaccesories', 'Kitchen Accessories'],
  ['decor', 'Decor'],
  ['flaskbottles', 'Flask & Bottles'],
  ['mats', 'Mats'],
  ['tray', 'Tray'],
  ['saltshakers', 'Salt Shakers'],
  ['sugardish', 'Sugardish'],
];

export function Header() {
  const { getTotalItems } = useCart();
  const { currency, setCurrency, availableCurrencies } = useCurrency();
  const { products } = useProducts();
  const navigate = useNavigate();
  const { isMobile } = useMobile();

  const [searchQuery, setSearchQuery] = useState('');
  const [scope, setScope] = useState('all');
  const [suggestions, setSuggestions] = useState([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileDropdownHovered, setProfileDropdownHovered] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const profileRef = useRef(null);
  const currencyRef = useRef(null);
  const searchRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const cartItemCount = getTotalItems();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsAuthorized(false);
        return;
      }

      const userEmail = session.user.email;
      if (userEmail === ADMIN_EMAIL) {
        setIsAuthorized(true);
        return;
      }

      const { data: employee } = await supabase
        .from('employees')
        .select('email')
        .eq('email', userEmail)
        .single();

      setIsAuthorized(!!employee);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Suggestions: respect the selected category scope
  useEffect(() => {
    if (searchQuery.length > 1) {
      const q = searchQuery.toLowerCase();
      const filtered = products
        .filter(p => p.name.toLowerCase().includes(q))
        .filter(p => scope === 'all' || p.category_slug === scope)
        .slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, scope, products]);

  const handleOutside = (e) => {
    // Close dropdowns
    if (!profileRef.current?.contains(e.target) && !profileDropdownHovered) setIsProfileOpen(false);
    if (!currencyRef.current?.contains(e.target)) setIsCurrencyOpen(false);
    if (!searchRef.current?.contains(e.target)) setSuggestions([]);
    // Close mobile menu if clicked outside and it's open
    if (isMobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(e.target) && e.target.className !== 'mobile-menu-toggle') {
      setIsMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isMobileMenuOpen, profileDropdownHovered]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    const params = new URLSearchParams({ q });
    if (scope !== 'all') params.set('category', scope);
    navigate(`/search?${params.toString()}`);
    setSearchQuery('');
    setSuggestions([]);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false); // Close mobile menu on search
  };

  const handleSuggestionClick = (product) => {
    navigate(`/product/${product.id}`);
    setSearchQuery('');
    setSuggestions([]);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-row">
          <div className="header-start">
            {isMobile && (
              <button
                className="icon-button mobile-menu-toggle"
                onClick={() => setIsMobileMenuOpen(v => !v)}
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}

            <Link to="/" className="logo">
              <img
                src="/Image/cookware-logo.svg"
                alt="Cookware"
                className="logo-image"
              />
            </Link>

          </div>

          <div className="header-search" ref={searchRef}>
            <form className="search-bar" role="search" onSubmit={handleSearch}>
              <span className="search-scope">
                <select
                  className="search-select"
                  aria-label="Search in category"
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(([slug, label]) => (
                    <option key={slug} value={slug}>{label}</option>
                  ))}
                </select>
                <ChevronDown size={15} className="search-chev" aria-hidden="true" />
              </span>

              <input
                type="search"
                className="search-input"
                placeholder="Search cookware, knives, plates…"
                aria-label="Search products"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <button className="search-submit" type="submit" aria-label="Search">
                <Search size={24} />
              </button>
            </form>

            {suggestions.length > 0 && (
              <div className="search-suggestions" role="listbox" aria-label="Suggestions">
                {suggestions.map(product => (
                  <div
                    key={product.id}
                    className="suggestion-item"
                    role="option"
                    aria-selected="false"
                    onClick={() => handleSuggestionClick(product)}
                  >
                    <img src={product.image_url} alt="" className="suggestion-img" />
                    <div className="suggestion-info">
                      <span className="suggestion-name">{product.name}</span>
                      <span className="suggestion-category">{product.category_slug}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="header-actions">
            <div className="icon-group">
              <div
                className="profile-dropdown"
                ref={profileRef}
                onMouseEnter={() => {
                  setProfileDropdownHovered(true);
                  setIsProfileOpen(true);
                }}
                onMouseLeave={() => {
                  setProfileDropdownHovered(false);
                  setIsProfileOpen(false);
                }}
              >
                <button
                  className="icon-button"
                  onClick={() => setIsProfileOpen(v => !v)}
                  aria-haspopup="true"
                  aria-expanded={isProfileOpen}
                >
                  <img
                    src="/Image/cookware-icon.svg"
                    alt="Cookware"
                    className="profile-icon-img"
                    loading="eager"
                    decoding="sync"
                  />
                </button>
                {isProfileOpen && (
                  <div className="profile-menu">
                    <Link to="/profile" className="profile-item" onClick={() => setIsProfileOpen(false)}>My Profile</Link>
                    <Link to="/login" className="profile-item" onClick={() => setIsProfileOpen(false)}>Login</Link>
                    <Link to="/register" className="profile-item" onClick={() => setIsProfileOpen(false)}>Register</Link>
                  </div>
                )}
              </div>

              <Link to="/cart" className="icon-button cart-button">
                <ShoppingCart size={20} />
                {cartItemCount > 0 && (
                  <span className="cart-badge">{cartItemCount}</span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {isMobile && isMobileMenuOpen && (
        <div className="mobile-menu-overlay" ref={mobileMenuRef}>
          <div className="mobile-menu">
            {/* Categories */}
            <div className="mobile-menu-section">
              <h3 className="mobile-menu-title">Categories</h3>
              {categories.map(([slug, label]) => (
                <Link
                  key={slug}
                  to={`/category/${slug}`}
                  className="mobile-menu-item"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Profile/Auth Links */}
            <div className="mobile-menu-section">
              <h3 className="mobile-menu-title">Account</h3>
              <Link to="/login" className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
              <Link to="/register" className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>Register</Link>
              {isAuthorized && (
                <Link to="/admin/add-product" className="mobile-menu-item admin-link" onClick={() => setIsMobileMenuOpen(false)}>
                  Admin Panel
                </Link>
              )}
            </div>

            {/* Other static links */}
            <div className="mobile-menu-section">
              <h3 className="mobile-menu-title">Information</h3>
              <Link to="/care-tips" className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>Care Tips</Link>
              <Link to="/shipping" className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>Shipping</Link>
              <Link to="/returns" className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>Returns</Link>
              <Link to="/warranty" className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>Warranty</Link>
              <Link to="/faq" className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>FAQ</Link>
              <Link to="/offers" className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>Offers</Link>
              <Link to="/season-bundling" className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>Season Bundling</Link>
              <Link to="/loyalty" className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>Loyalty Program</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}