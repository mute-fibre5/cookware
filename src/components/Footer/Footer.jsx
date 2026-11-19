import { Link } from 'react-router-dom';
import { 
  Phone, Mail, MapPin, Instagram, Youtube, MessageCircle, Shield, 
  Truck, RefreshCw, Star, Heart, Clock, Headphones, Info, FileText
} from 'lucide-react';
import './Footer.css';

export function Footer() {
  return (
    <>
      <footer className="footer">
        <div className="footer-main">
          <div className="container">
            {/* Trust Signals Section */}
            

            {/* Footer Content */}
            <div className="footer-content">
              {/* Brand Section */}
              <div className="footer-section brand-section">
                <Link to="/" className="footer-logo">
                  <img 
                    src="/Image/cookware-logo.svg" 
                    alt="Cookware" 
                    className="footer-logo-img"
                    onError={(e) => e.src = '/placeholders/logo-placeholder.svg'}
                  />
                  <span>Cookware</span>
                </Link>
                <p className="tagline">Premium Kitchenware & Hotel Supplies Since 2018</p>
                <p className="address">
                  <MapPin size={16} />
                  <span>Nairobi, Kenya - Kamukunji Gateway Mall 2nd Floor Shop 24</span>
                </p>
              </div>

              {/* Customer Service with Working Links */}
              <div className="footer-section">
                <h3>Customer Service</h3>
                <ul>
                  <li>
                    <Link to="/shipping">
                      <Truck size={16} />
                      <span>Shipping & Delivery</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/returns">
                      <RefreshCw size={16} />
                      <span>Returns Policy</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/warranty">
                      <Shield size={16} />
                      <span>Warranty & Support</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/faq">
                      <Headphones size={16} />
                      <span>FAQ & Help</span>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Resources with Correct Social Links */}
              <div className="footer-section">
                <h3>Resources</h3>
                <ul>
                  <li>
                    <a href="https://instagram.com/kitchen_wish" target="_blank" rel="noopener noreferrer">
                      <Instagram size={16} />
                      <span>Instagram: @kitchen_wish</span>
                    </a>
                  </li>
                  <li>
                    <a href="https://youtube.com/@cookwarekichenwish" target="_blank" rel="noopener noreferrer">
                      <Youtube size={16} />
                      <span>YouTube: cookwarekichenwish</span>
                    </a>
                  </li>
                  <li>
                    <Link to="/reviews">
                      <Star size={16} />
                      <span>Product Reviews</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/care-tips">
                      <Heart size={16} />
                      <span>Care Tips & Guides</span>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact with Correct Info */}
              <div className="footer-section">
                <h3>Contact Us</h3>
                <ul className="contact-list">
                  <li>
                    <Phone size={16} />
                    <a href="tel:+254708542589">+254 708 542 589</a>
                  </li>
                  <li>
                    <Mail size={16} />
                    <a href="mailto:kamundia2020@gmail.com">cookwarekitchenwish@gmail.com</a>
                  </li>
                  <li>
                    <MessageCircle size={16} />
                    <a href="https://wa.me/254708542589" target="_blank" rel="noopener noreferrer">WhatsApp: 0708542589</a>
                  </li>
                  <li>
                    <MapPin size={16} />
                    <span>Mon-Sat: 8AM-6PM</span>
                  </li>
                </ul>

                <div className="social-proof">
                  <p>💬 <strong>WhatsApp Support</strong></p>
                  <p>Get instant help choosing products</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Policy Links */}
        <div className="footer-bottom">
          <div className="container">
            <p>&copy; 2026 Cookware. Kitchenware. Hotel Supplies. Decor. All rights reserved.</p>
            <div className="footer-links">
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
              <Link to="/return-policy">Return & Policy</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Float Button */}
      <a 
        href="https://wa.me/254708542589?text=Hello%20Cookware,%20I%20need%20help%20choosing%20kitchenware" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="whatsapp-float"
      >
        <MessageCircle size={24} />
        <span>Chat with Us</span>
      </a>
    </>
  );
}