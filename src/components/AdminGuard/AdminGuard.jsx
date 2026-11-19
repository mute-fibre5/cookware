import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { ADMIN_EMAIL } from '../../utils/constants';
import './AdminGuard.css';

export function AdminGuard({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const checkAuthorization = async (currentSession) => {
    if (!currentSession) {
      setIsAuthorized(false);
      return false;
    }

    const userEmail = currentSession.user.email;
    
    // Admin always has access
    if (userEmail === ADMIN_EMAIL) {
      setIsAuthorized(true);
      return true;
    }

    // Check if the user is an employee
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('email')
        .eq('email', userEmail)
        .single();
      
      const authorized = !!data && !error;
      setIsAuthorized(authorized);
      return authorized;
    } catch (err) {
      console.error('Error checking employee status:', err);
      setIsAuthorized(false);
      return false;
    }
  };

  useEffect(() => {
    // Check existing session
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        await checkAuthorization(session);
      }
      setLoading(false);
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session) {
        await checkAuthorization(session);
      } else {
        setIsAuthorized(false);
      }
      
      if (event === 'SIGNED_IN' && session) {
        setError('');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      const authorized = await checkAuthorization(data.session);
      if (!authorized) {
        setError('❌ Access Denied: Your account does not have admin or employee privileges.');
        // Sign out if not authorized to prevent staying in a weird state
        await supabase.auth.signOut();
        setSession(null);
        setIsAuthorized(false);
      }
    }
    
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthorized(false);
    setSession(null);
    navigate('/');
  };

  if (loading) {
    return <div className="admin-guard-loading">Verifying access...</div>;
  }

  // If no session OR the logged in user is NOT authorized
  if (!session || !isAuthorized) {
    return (
      <div className="admin-guard-container">
        <div className="admin-login-box">
          <h2>🔒 Admin & Employee Access</h2>
          <p className="subtitle">Sign in to manage the store</p>
          
          {session && !isAuthorized && (
            <div className="error-message">
              ❌ Access Denied: Your account ({session.user.email}) does not have required privileges.
              <button onClick={handleLogout} className="text-btn">Switch Account</button>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
          
          {!session && (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="admin@yourcompany.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          )}

          {session && !isAuthorized && (
            <div style={{ marginTop: '1rem' }}>
              <button onClick={() => navigate('/')} className="back-btn">Back to Shop</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // User is logged in AND is authorized - show admin panel
  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={handleLogout} 
        className="logout-floating-btn"
        style={{
          position: 'fixed',
          top: '90px',
          right: '20px',
          background: '#e74c3c',
          color: 'white',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '6px',
          cursor: 'pointer',
          zIndex: 1000,
          fontWeight: 600
        }}
      >
        Logout
      </button>
      {children}
    </div>
  );
}