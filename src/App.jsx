import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProductProvider } from './context/ProductContext';
import { CartProvider } from './context/CartContext';
import { LoyaltyProvider } from './context/LoyaltyContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { Header } from './components/Header/Header';
import { Footer } from './components/Footer/Footer';
import PWAInstall from './components/PWAInstall/PWAInstall';
import { Home } from './pages/Home/Home';
import { ProductDetail } from './pages/ProductDetail/ProductDetail';
import { CartPage } from './pages/Cart/CartPage';
import { Login } from './pages/Login/Login';
import { Register } from './pages/Register/Register';
import { ForgotPassword } from './pages/ForgotPassword/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword/ResetPassword';
import { AdminPanel } from './pages/Adminpanel/AdminPanel';
import { AdminGuard } from './components/AdminGuard/AdminGuard';
import { CareTips } from './pages/CareTips/CareTips';
import { Shipping } from './pages/Shipping/Shipping';
import { Returns } from './pages/Returns/Returns';
import { Warranty } from './pages/Warranty/Warranty';
import { FAQ } from './pages/FAQ/FAQ';
import { Category } from './pages/Category/Category'
import { Offers } from "./pages/Offers/Offers";
import { SeasonBundling } from './pages/SeasonBundling/SeasonBundling';
import { SearchResults } from './pages/SearchResults/SearchResults';
import { LoyaltyProgram } from './pages/LoyaltyProgram/LoyaltyProgram';
import { Profile } from './pages/Profile/Profile';
import './App.css';

function App() {
  return (
    <ProductProvider>
      <CurrencyProvider>
        <CartProvider>
          <LoyaltyProvider>
            <BrowserRouter>
            <div className="app">
              <Header />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/category/:category" element={<Category />} />
                  <Route path="/season-bundling" element={<SeasonBundling />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="/loyalty" element={<LoyaltyProgram />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/care-tips" element={<CareTips />} />
                  <Route path="/shipping" element={<Shipping />} />
                  <Route path="/returns" element={<Returns />} />
                  <Route path="/warranty" element={<Warranty />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/offers" element={<Offers />} />
                  <Route path="/admin/add-product" element={<AdminGuard><AdminPanel /></AdminGuard>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
              <PWAInstall />
            </div>
          </BrowserRouter>
        </LoyaltyProvider>
      </CartProvider>
    </CurrencyProvider>
  </ProductProvider>
  );
}

export default App;