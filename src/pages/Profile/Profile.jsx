import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import { User, Package, MapPin, Heart, LogOut, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCurrency } from "../../context/CurrencyContext";
import "./Profile.css";

export function Profile() {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setUser(session.user);
      
      // Fetch user data
      fetchOrders(session.user.id);
      fetchWishlist(session.user.id);
      fetchAddresses(session.user.id);
      setLoading(false);
    }
    getProfile();
  }, [navigate]);

  const fetchOrders = async (userId) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(*))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error) setOrders(data || []);
  };

  const fetchWishlist = async (userId) => {
    const { data, error } = await supabase
      .from('wishlist')
      .select('*, products(*)')
      .eq('user_id', userId);
    if (!error) setWishlist(data || []);
  };

  const fetchAddresses = async (userId) => {
    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId);
    if (!error) setAddresses(data || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) return <div className="loading-spinner">Loading profile...</div>;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <aside className="profile-sidebar">
          <div className="user-info">
            <div className="user-avatar">
              <User size={40} />
            </div>
            <div className="user-details">
              <h3>{user?.user_metadata?.full_name || 'User'}</h3>
              <p>{user?.email}</p>
            </div>
          </div>

          <nav className="profile-nav">
            <button 
              className={activeTab === 'orders' ? 'active' : ''} 
              onClick={() => setActiveTab('orders')}
            >
              <Package size={20} /> Order History
            </button>
            <button 
              className={activeTab === 'wishlist' ? 'active' : ''} 
              onClick={() => setActiveTab('wishlist')}
            >
              <Heart size={20} /> Wishlist
            </button>
            <button 
              className={activeTab === 'addresses' ? 'active' : ''} 
              onClick={() => setActiveTab('addresses')}
            >
              <MapPin size={20} /> My Addresses
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={20} /> Logout
            </button>
          </nav>
        </aside>

        <main className="profile-content">
          {activeTab === 'orders' && (
            <div className="orders-section">
              <h2>Order History</h2>
              {orders.length === 0 ? (
                <div className="empty-state">
                  <Package size={48} />
                  <p>You haven't placed any orders yet.</p>
                  <button onClick={() => navigate('/')}>Start Shopping</button>
                </div>
              ) : (
                <div className="order-list">
                  {orders.map(order => (
                    <div key={order.id} className="order-card">
                      <div className="order-header">
                        <div>
                          <span className="order-id">Order #{order.id.slice(0, 8)}</span>
                          <span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                        <span className={`order-status ${order.status}`}>{order.status}</span>
                      </div>
                      <div className="order-items">
                        {order.order_items.map(item => (
                          <div key={item.id} className="order-item">
                            <img src={item.products.image_url} alt={item.products.name} />
                            <div className="item-info">
                              <h4>{item.products.name}</h4>
                              <p>Qty: {item.quantity}</p>
                            </div>
                            <span className="item-price">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="order-footer">
                        <strong>Total: {formatPrice(order.total_amount)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div className="wishlist-section">
              <h2>My Wishlist</h2>
              {wishlist.length === 0 ? (
                <div className="empty-state">
                  <Heart size={48} />
                  <p>Your wishlist is empty.</p>
                  <button onClick={() => navigate('/')}>Explore Products</button>
                </div>
              ) : (
                <div className="wishlist-grid">
                  {wishlist.map(item => (
                    <div key={item.id} className="wishlist-card">
                      <img src={item.products.image_url} alt={item.products.name} />
                      <h4>{item.products.name}</h4>
                      <p>{formatPrice(item.products.price)}</p>
                      <button onClick={() => navigate(`/product/${item.products.id}`)}>View Product</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="addresses-section">
              <h2>My Addresses</h2>
              <div className="address-grid">
                {addresses.map(addr => (
                  <div key={addr.id} className={`address-card ${addr.is_default ? 'default' : ''}`}>
                    <h4>{addr.full_name}</h4>
                    <p>{addr.address_line1}</p>
                    {addr.address_line2 && <p>{addr.address_line2}</p>}
                    <p>{addr.city}, {addr.state} {addr.postal_code}</p>
                    <p>{addr.country}</p>
                    {addr.is_default && <span className="default-tag">Default</span>}
                  </div>
                ))}
                <button className="add-address-card">+ Add New Address</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}