import { useProducts } from '../../context/ProductContext';
import { supabase } from '../../utils/supabaseClient';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Trash2, Upload, ClipboardList, CheckCircle, Package } from 'lucide-react';
import { ADMIN_EMAIL } from '../../utils/constants';
import './AdminPanel.css';

const CATEGORIES = [
  { value: 'cookware', label: 'Cookware' },
  { value: 'knives', label: 'Knives' },
  { value: 'plates', label: 'Plates' },
  { value: 'cups', label: 'Cups' },
  { value: 'glasses', label: 'Glasses' },
  { value: 'fancyplastic', label: 'Fancy Plastic' },
  { value: 'kitchenaccesories', label: 'Kitchen Accessories' },
  { value: 'decor', label: 'Decor' },
  { value: 'flaskbottles', label: 'Flask & Bottles' },
  { value: 'mats', label: 'Mats' },
  { value: 'tray', label: 'Tray' },
  { value: 'saltshakers', label: 'Salt Shakers' },
  { value: 'sugardish', label: 'Sugardish' },
];

export function AdminPanel() {
  const { addProduct, deleteProduct, products } = useProducts();
  const navigate = useNavigate();
  const [newProduct, setNewProduct] = useState({
      // Session check: Only allow authenticated users
    name: '',
    price: '',
    category_slug: 'cookware',
    description: '',
    tags: [],
    discount: 0,
    trending: false,
    stock_quantity: 0,
    low_stock_threshold: 5
  });
    useEffect(() => {
      async function checkSession() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login');
          return;
        }

        const userEmail = session.user.email;
        if (userEmail === ADMIN_EMAIL) return;

        // Check if employee
        const { data: employee } = await supabase
          .from('employees')
          .select('email')
          .eq('email', userEmail)
          .single();

        if (!employee) {
          navigate('/login');
        }
      }
      checkSession();
    }, [navigate]);
  const [newEmployee, setNewEmployee] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: 'sales'
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [deleting, setDeleting] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'employees', 'orders'
  const [allOrders, setAllOrders] = useState([]);
  const [bulkText, setBulkText] = useState('');

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate('/');
    }
  };

  const loadAllOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, buyers(name, email), order_items(*, products(*))')
      .order('created_at', { ascending: false });
    if (!error) setAllOrders(data || []);
  };

  const updateOrderStatus = async (orderId, status) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    if (!error) {
      setMessage({ type: 'success', text: `Order status updated to ${status}` });
      loadAllOrders();
    }
  };

  const handleBulkAdd = async () => {
    try {
      const lines = bulkText.trim().split('\n');
      const productsToAdd = lines.map(line => {
        const [name, price, category, stock] = line.split(',');
        return {
          name: name.trim(),
          price: parseFloat(price),
          category_slug: category?.trim() || 'cookware',
          stock_quantity: parseInt(stock) || 0,
          in_stock: (parseInt(stock) || 0) > 0,
          image_url: '/placeholders/image-placeholder.svg'
        };
      });

      for (const p of productsToAdd) {
        await addProduct(p);
      }
      setMessage({ type: 'success', text: `Successfully added ${productsToAdd.length} products` });
      setBulkText('');
    } catch (err) {
      setMessage({ type: 'error', text: 'Error in bulk addition format. Use: Name, Price, Category, Stock' });
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      setDeleting(productId);
      const success = await deleteProduct(productId);
      setDeleting(null);
      
      if (success) {
        setMessage({ type: 'success', text: `✅ Product "${productName}" deleted successfully!` });
      } else {
        setMessage({ type: 'error', text: '❌ Failed to delete product' });
      }
    }
  };

  const uploadImage = async (file) => {
    // Note: setUploading should be handled by the caller if doing bulk
    const fileName = `products/${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name.replace(/\s+/g, '-')}`;
    
    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      throw error;
    }
    
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    if (!newProduct.name.trim() || !newProduct.price) {
      setMessage({ type: 'error', text: 'Please fill in name and price' });
      return;
    }

    if (parseFloat(newProduct.price) <= 0) {
      setMessage({ type: 'error', text: 'Price must be greater than 0' });
      return;
    }

    setUploading(true);
    let imageUrl = '/placeholders/image-placeholder.svg';
    let imageUrls = [];

    try {
      if (imageFiles.length > 0) {
        // Upload all selected images
        const uploadPromises = Array.from(imageFiles).map(file => uploadImage(file));
        imageUrls = await Promise.all(uploadPromises);
        // Use the first image as the main image_url
        imageUrl = imageUrls[0];
      }

      const productToAdd = {
        name: newProduct.name.trim(),
        price: parseFloat(newProduct.price),
        category_slug: newProduct.category_slug,
        image_url: imageUrl,
        image_urls: imageUrls,
        description: newProduct.description.trim(),
        tags: newProduct.tags,
        discount: parseInt(newProduct.discount) || 0,
        trending: newProduct.trending,
        in_stock: parseInt(newProduct.stock_quantity) > 0,
        stock_quantity: parseInt(newProduct.stock_quantity),
        low_stock_threshold: parseInt(newProduct.low_stock_threshold)
      };

      const success = await addProduct(productToAdd);
      
      if (success) {
        setMessage({ type: 'success', text: '✅ Product added successfully!' });
        setNewProduct({
          name: '',
          price: '',
          category_slug: 'cookware',
          description: '',
          tags: [],
          discount: 0,
          trending: false,
          stock_quantity: 0,
          low_stock_threshold: 5
        });
        setImageFiles([]);
      } else {
        setMessage({ type: 'error', text: '❌ Failed to add product. Please check console for details.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Upload failed: ' + error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    if (!newEmployee.full_name.trim()) {
      setMessage({ type: 'error', text: 'Please enter employee name' });
      return;
    }

    if (!newEmployee.email.trim() || !newEmployee.email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email' });
      return;
    }

    if (!newEmployee.phone.trim() || newEmployee.phone.length < 9) {
      setMessage({ type: 'error', text: 'Please enter a valid phone number' });
      return;
    }

    setAddingEmployee(true);

    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([
          {
            full_name: newEmployee.full_name.trim(),
            email: newEmployee.email.trim(),
            phone: newEmployee.phone.trim(),
            department: newEmployee.department,
            created_at: new Date()
          }
        ])
        .select();

      if (error) {
        console.error('Supabase error adding employee:', error);
        setMessage({ type: 'error', text: '❌ Failed to add employee: ' + error.message });
      } else if (data && data.length > 0) {
        setMessage({ type: 'success', text: `✅ Employee "${newEmployee.full_name}" added successfully!` });
        setNewEmployee({ full_name: '', email: '', phone: '', department: 'sales' });
        // Reload employees list
        await loadEmployees();
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      setMessage({ type: 'error', text: 'Error adding employee: ' + error.message });
    } finally {
      setAddingEmployee(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading employees:', error);
      } else if (data) {
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleDeleteEmployee = async (employeeId, employeeName) => {
    if (confirm(`Are you sure you want to delete employee "${employeeName}"? This action cannot be undone.`)) {
      setDeleting(employeeId);

      try {
        const { error } = await supabase
          .from('employees')
          .delete()
          .eq('id', employeeId);

        if (error) {
          setMessage({ type: 'error', text: '❌ Failed to delete employee' });
        } else {
          setMessage({ type: 'success', text: `✅ Employee "${employeeName}" deleted successfully!` });
          await loadEmployees();
        }
      } catch (error) {
        console.error('Error deleting employee:', error);
        setMessage({ type: 'error', text: 'Error deleting employee' });
      } finally {
        setDeleting(null);
      }
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="admin-title-section">
          <h1>🛠️ Admin Dashboard</h1>
          <div className="admin-tabs">
            <button 
              className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              📦 Products
            </button>
            <button 
              className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('orders');
                loadAllOrders();
              }}
            >
              📋 Orders
            </button>
            <button 
              className={`tab-btn ${activeTab === 'employees' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('employees');
                loadEmployees();
              }}
            >
              👥 Employees
            </button>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      <div style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

      {activeTab === 'products' && (
        <>
          <div className="admin-actions">
            <section className="add-single-product">
              <h2>➕ Add Single Product</h2>
              <form onSubmit={handleAddProduct}>
                {/* ... existing single product form fields ... */}
                <div className="form-group">
                  <label htmlFor="name">Product Name *</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="e.g., Premium Stainless Steel Pot"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="price">Price (KSH) *</label>
                  <input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="1000"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="category">Category *</label>
                  <select
                    id="category"
                    value={newProduct.category_slug}
                    onChange={(e) => setNewProduct({...newProduct, category_slug: e.target.value})}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    rows="4"
                    placeholder="Product details, features, dimensions..."
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="image">Product Images (Multiple allowed)</label>
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setImageFiles(e.target.files)}
                  />
                  {imageFiles.length > 0 && (
                    <p className="file-name">Selected: {imageFiles.length} images</p>
                  )}
                  {uploading && (
                    <div className="uploading">Uploading images... ⏳</div>
                  )}
                </div>

                <div className="stock-management-section">
                  <h3>📦 Stock Management</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="stock_quantity">Initial Stock Quantity *</label>
                      <input
                        id="stock_quantity"
                        type="number"
                        min="0"
                        placeholder="100"
                        value={newProduct.stock_quantity}
                        onChange={(e) => setNewProduct({...newProduct, stock_quantity: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="low_stock_threshold">Low Stock Alert Threshold *</label>
                      <input
                        id="low_stock_threshold"
                        type="number"
                        min="0"
                        placeholder="5"
                        value={newProduct.low_stock_threshold}
                        onChange={(e) => setNewProduct({...newProduct, low_stock_threshold: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="bundling-section">
                  <h3>🎯 Season Bundling</h3>
                  <div className="form-group">
                    <label>Season Tags</label>
                    <div className="checkbox-group">
                      {['summer', 'winter', 'spring', 'fall'].map(season => (
                        <label key={season} className="checkbox-label">
                          <input 
                            type="checkbox"
                            checked={newProduct.tags.includes(season)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewProduct({...newProduct, tags: [...newProduct.tags, season]});
                              } else {
                                setNewProduct({...newProduct, tags: newProduct.tags.filter(t => t !== season)});
                              }
                            }}
                          />
                          <span>{season.charAt(0).toUpperCase() + season.slice(1)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="discount">Discount % (0-100)</label>
                    <input 
                      id="discount"
                      type="number" 
                      min="0" 
                      max="100"
                      value={newProduct.discount}
                      onChange={(e) => setNewProduct({...newProduct, discount: parseInt(e.target.value) || 0})}
                      placeholder="0"
                    />
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox"
                        checked={newProduct.trending}
                        onChange={(e) => setNewProduct({...newProduct, trending: e.target.checked})}
                      />
                      <span>Mark as Trending 🔥</span>
                    </label>
                  </div>
                </div>

                <button type="submit" className="submit-btn" disabled={uploading}>
                  {uploading ? 'Adding Product...' : 'Add Product'}
                </button>
              </form>
            </section>

            <section className="bulk-add-section">
              <h2><Upload size={20} /> Bulk Import Products</h2>
              <p className="hint">Format: Name, Price, Category, Stock (one per line)</p>
              <textarea 
                rows="10" 
                placeholder="Stainless Pan, 1200, cookware, 50&#10;Chef Knife, 800, knives, 20"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
              />
              <button onClick={handleBulkAdd} className="bulk-btn">Import Products</button>
            </section>
          </div>

          {/* Products List Section */}
          <section className="products-list-section">
            <h2>📦 Manage Products ({products.length})</h2>
            {/* ... products table ... */}
            <div className="products-table-wrapper">
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Price (KSH)</th>
                      <th>Category</th>
                      <th>Stock</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id}>
                        <td>
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="product-thumb"
                          />
                        </td>
                        <td>{product.name}</td>
                        <td>KSH {product.price.toLocaleString()}</td>
                        <td>{product.category_slug}</td>
                        <td>
                          <div className="stock-info">
                            <span className={product.stock_quantity > 0 ? 'stock-yes' : 'stock-no'}>
                              {product.stock_quantity} in stock
                            </span>
                            {product.stock_quantity <= (product.low_stock_threshold || 5) && product.stock_quantity > 0 && (
                              <span className="low-stock-warning" title="Low stock alert!">⚠️ Low</span>
                            )}
                            {product.stock_quantity === 0 && (
                              <span className="out-of-stock-alert">🚫 Out</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <button
                            className="delete-product-btn"
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            disabled={deleting === product.id}
                            title="Delete product"
                          >
                            <Trash2 size={16} />
                            {deleting === product.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          </section>
        </>
      )}

      {activeTab === 'orders' && (
        <section className="admin-orders">
          <h2>📋 Centralized Order Management</h2>
          <div className="orders-grid">
            {allOrders.map(order => (
              <div key={order.id} className="admin-order-card">
                <div className="order-main-info">
                  <div className="order-id-date">
                    <h3>Order #{order.id.slice(0, 8)}</h3>
                    <p>{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="order-status-actions">
                    <select 
                      value={order.status} 
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className={`status-select ${order.status}`}
                    >
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="order-customer">
                  <p><strong>Customer:</strong> {order.buyers?.name} ({order.buyers?.email})</p>
                </div>

                <div className="order-items-summary">
                  <h4>Items ({order.order_items.length})</h4>
                  <ul>
                    {order.order_items.map(item => (
                      <li key={item.id}>
                        {item.products?.name} x {item.quantity}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="order-total-amount">
                  <p>Total: <strong>KSH {order.total_amount.toLocaleString()}</strong></p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'employees' && (
        <>
          <form onSubmit={handleAddEmployee}>
            <h2>➕ Add New Employee</h2>

            <div className="form-group">
              <label htmlFor="emp_name">Full Name *</label>
              <input
                id="emp_name"
                type="text"
                placeholder="e.g., John Doe"
                value={newEmployee.full_name}
                onChange={(e) => setNewEmployee({...newEmployee, full_name: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="emp_email">Email *</label>
              <input
                id="emp_email"
                type="email"
                placeholder="john@example.com"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="emp_phone">Phone Number *</label>
              <input
                id="emp_phone"
                type="tel"
                placeholder="0712345678"
                value={newEmployee.phone}
                onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="emp_department">Department</label>
              <select
                id="emp_department"
                value={newEmployee.department}
                onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
              >
                <option value="sales">Sales</option>
                <option value="warehouse">Warehouse</option>
                <option value="delivery">Delivery</option>
                <option value="support">Customer Support</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button type="submit" className="submit-btn" disabled={addingEmployee}>
              {addingEmployee ? 'Adding Employee...' : 'Add Employee'}
            </button>
          </form>

          {/* Employees List Section */}
          <section className="employees-list-section">
            <h2>👥 Manage Employees ({employees.length})</h2>
            
            {employees.length === 0 ? (
              <p className="no-employees">No employees yet. Add your first employee above!</p>
            ) : (
              <div className="employees-table-wrapper">
                <table className="employees-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Department</th>
                      <th>Date Added</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(employee => (
                      <tr key={employee.id}>
                        <td>{employee.full_name}</td>
                        <td>{employee.email}</td>
                        <td>{employee.phone}</td>
                        <td>{employee.department}</td>
                        <td>{new Date(employee.created_at).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="delete-employee-btn"
                            onClick={() => handleDeleteEmployee(employee.id, employee.full_name)}
                            disabled={deleting === employee.id}
                            title="Delete employee"
                          >
                            <Trash2 size={16} />
                            {deleting === employee.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
      </div>
    </div>
  );
}