import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="navbar">
      <div className="navbar-logo">
        <Link to="/">Cookware Store</Link>
      </div>
      <div className="navbar-search">
        <input
          type="text"
          placeholder="Search products..."
          className="search-input"
        />
      </div>
      <div className="navbar-icons">
        <div
          className="profile-dropdown-wrapper"
          onMouseEnter={() => setShowDropdown(true)}
          onMouseLeave={() => setShowDropdown(false)}
        >
          <span className="profile-icon">👤</span>
          {showDropdown && (
            <div className="profile-dropdown">
              <Link to="/profile">My Profile</Link>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </div>
          )}
        </div>
        <Link to="/cart" className="cart-icon">
          🛒
        </Link>
      </div>
    </header>
  );
}
