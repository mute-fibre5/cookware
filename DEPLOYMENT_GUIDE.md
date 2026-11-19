# 🚀 Deployment & Launch Guide

## 🔧 Setup Environment Variables

### 1. Create `.env.local` file
Copy `.env.example` and create `.env.local` with your actual credentials:

```bash
cp .env.example .env.local
```

### 2. Fill in Payment API Credentials

#### **M-Pesa Configuration**
Get credentials from [Safaricom Daraja](https://developer.safaricom.co.ke):
```
REACT_APP_MPESA_CONSUMER_KEY=your-consumer-key
REACT_APP_MPESA_CONSUMER_SECRET=your-consumer-secret
REACT_APP_MPESA_SHORT_CODE=174379  # Your business short code
REACT_APP_MPESA_PASSKEY=your-passkey
```

#### **Card Payment (Pesapal)**
Get credentials from [Pesapal](https://www.pesapal.com):
```
REACT_APP_PESAPAL_CONSUMER_KEY=your-pesapal-key
REACT_APP_PESAPAL_CONSUMER_SECRET=your-pesapal-secret
```

#### **Supabase**
Get credentials from [Supabase](https://supabase.com):
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🏠 Local Development

### Run locally:
```bash
npm install
npm run dev
```

Visit: `http://localhost:5173`

### Build for production:
```bash
npm run build
```

### Preview production build:
```bash
npm run preview
```

---

## 🌐 Deploy Online

### **Option 1: Netlify (FREE)**

#### Advantages:
✅ Free tier  
✅ Easy deployment  
✅ Automatic HTTPS  
✅ Forms and functions support  

#### Steps:
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod --dir=dist
```

**Netlify Dashboard:** https://netlify.com

---

### **Option 2: Railway (Affordable)**

#### Advantages:
✅ $5/month free tier  
✅ Simple deployment  
✅ Environment variables support  

```bash
npm install -g @railway/cli
railway login
railway init
railway up --environment production
```

**Railway Dashboard:** https://railway.app

---

### **Option 3: Self-Hosted (Linode/DigitalOcean)**

#### Prerequisites:
- Ubuntu 20.04+ server
- Node.js 16+
- Nginx or Apache

#### Steps:

**1. Install Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**2. Clone & Build:**
```bash
cd /path/to/cookware-store
npm install
npm run build
```

Copy or upload the project folder to your server before running these commands.

**3. Set up Nginx:**
```bash
sudo apt-get install -y nginx
sudo nano /etc/nginx/sites-available/cookware
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /home/ubuntu/cookware-store/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**4. Enable and start:**
```bash
sudo ln -s /etc/nginx/sites-available/cookware /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**5. Install SSL (Let's Encrypt):**
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

**6. Auto-start with PM2:**
```bash
sudo npm install -g pm2
cd /home/ubuntu/cookware-store
pm2 start "npm run preview" --name cookware
pm2 startup
pm2 save
```

---

## 🌍 Domain Setup

### Point domain to your server:

1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Find DNS settings
3. Update A record to your server IP:
   ```
   Type: A
   Name: @
   Value: your-server-ip
   ```
4. Update www subdomain:
   ```
   Type: CNAME
   Name: www
   Value: your-domain.com
   ```

---

## 💳 Payment Gateway Setup

### M-Pesa Setup

1. Register at [Safaricom Daraja](https://developer.safaricom.co.ke)
2. Create App in sandbox
3. Get credentials:
   - Consumer Key
   - Consumer Secret
   - Business Short Code
   - Passkey
4. Add to `.env.local`

### Pesapal Setup

1. Register at [Pesapal](https://www.pesapal.com)
2. Get API credentials from dashboard
3. Set callback URL to: `https://your-domain.com/api/pesapal/callback`
4. Add to `.env.local`

---

## 📊 Production Checklist

- [ ] Environment variables configured
- [ ] Database set up and migrated
- [ ] Payment APIs tested
- [ ] Email notifications configured
- [ ] SSL/HTTPS enabled
- [ ] Domain configured
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Error tracking enabled (Sentry)
- [ ] Analytics configured (Google Analytics)

---

## 🔒 Security Tips

1. **Never commit `.env.local`** - Add to `.gitignore`
2. **Use strong passwords** for all APIs
3. **Enable HTTPS** - Required for payment APIs
4. **Regular backups** - Set up automated backups
5. **Monitor logs** - Check server logs regularly
6. **Update dependencies** - Run `npm audit fix` regularly

---

## 📈 Performance Optimization

```bash
# Check build size
npm run build -- --report

# Analyze bundle
npm install -D rollup-plugin-visualizer

# Run lighthouse audit
npm install -g lighthouse
lighthouse https://your-domain.com
```

---

## 🐛 Troubleshooting

### Payment not working?
- Check `.env.local` credentials
- Ensure HTTPS is enabled
- Check Safaricom/Pesapal dashboard for API status

### Site not loading?
- Check DNS settings (wait up to 24 hours)
- Verify SSL certificate
- Check nginx logs: `sudo tail -f /var/log/nginx/error.log`

### Database connection error?
- Verify Supabase credentials
- Check network connectivity
- Review Supabase dashboard for errors

---

## 📞 Support Resources

- **Netlify Docs:** https://docs.netlify.com
- **Safaricom Daraja:** https://developer.safaricom.co.ke/docs
- **Pesapal Docs:** https://developer.pesapal.com
- **Supabase Docs:** https://supabase.com/docs

---

## ✅ Launch Status

Your app is ready to launch! Choose your preferred hosting option above and follow the setup instructions.

**Recommended for beginners:** Netlify (easiest, fastest)  
**Recommended for production:** DigitalOcean or Linode (more control)  
**Recommended for enterprise:** AWS or Google Cloud (scalable)

Happy launching! 🎉
