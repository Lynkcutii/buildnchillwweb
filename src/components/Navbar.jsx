import { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BiHomeAlt, BiInfoCircle, BiNews, BiEnvelope, 
  BiShield, BiShoppingBag, BiUser, BiPlusCircle, 
  BiLogOut, BiChevronDown, BiCreditCard 
} from 'react-icons/bi';
import { useData } from '../context/DataContext';
import { supabase } from '../supabaseClient';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { siteSettings, isAuthenticated, userProfile, loading } = useData();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const navbarNav = document.getElementById('navbarNav');
    if (navbarNav && navbarNav.classList.contains('show')) {
      const toggler = document.querySelector('.navbar-toggler');
      if (toggler) toggler.click();
    }
    setShowProfileMenu(false);
  }, [location]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Trang Chủ', icon: BiHomeAlt },
    { path: '/about', label: 'Giới Thiệu', icon: BiInfoCircle },
    { path: '/news', label: 'Tin Tức', icon: BiNews },
    { path: '/shop', label: 'Cửa Hàng', icon: BiShoppingBag },
    { path: '/contact', label: 'Liên Hệ', icon: BiEnvelope },
  ];

  return (
    <motion.nav
      className="navbar navbar-expand-lg sticky-top py-3"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      style={{ 
        background: 'rgba(255, 255, 255, 0.98)', 
        borderBottom: '2px solid var(--tet-gold)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        zIndex: 10000
      }}
    >
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <span className="fw-black text-danger h4 m-0" style={{ letterSpacing: '-1px' }}>
            {siteSettings?.site_title || 'BuildnChill'}
          </span>
        </Link>

        <button className="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-1">
            {navItems.map((item) => (
              <li key={item.path} className="nav-item">
                <Link className={`nav-link px-3 fw-bold ${isActive(item.path) ? 'active text-danger' : 'text-dark'}`} to={item.path}>
                  <item.icon className="me-1" /> {item.label}
                </Link>
              </li>
            ))}
            
            <li className="nav-item ms-lg-3 mt-3 mt-lg-0" ref={menuRef}>
              {loading ? (
                <div className="spinner-border spinner-border-sm text-danger mx-3"></div>
              ) : isAuthenticated ? (
                <div className="position-relative">
                  <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="btn d-flex align-items-center gap-2 p-1 pe-3 rounded-pill bg-light border transition-all"
                    style={{ border: '1px solid var(--tet-gold) !important' }}
                  >
                    <img 
                      src={`https://mc-heads.net/avatar/${userProfile?.username || 'Steve'}/32`} 
                      alt="avatar" 
                      className="rounded-circle border border-white"
                      style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                    />
                    <span className="fw-bold small d-none d-sm-inline">{userProfile?.username}</span>
                    <BiChevronDown className={`transition-all ${showProfileMenu ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showProfileMenu && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="position-absolute end-0 mt-2 tet-glass p-2 shadow-lg"
                        style={{ minWidth: '220px', zIndex: 10001, background: 'white' }}
                      >
                        <div className="p-3 border-bottom mb-2 text-center">
                          <div className="small text-muted mb-1">Số dư ví</div>
                          <div className="fw-black text-danger h5 m-0">{(userProfile?.wallet_balance || 0).toLocaleString()} VNĐ</div>
                        </div>

                        <Link to="/profile" className="dropdown-item p-2 d-flex align-items-center gap-2 rounded hover-bg-light">
                          <BiUser className="text-danger" /> Hồ sơ cá nhân
                        </Link>
                        
                        <Link to="/recharge" className="dropdown-item p-2 d-flex align-items-center gap-2 rounded hover-bg-light">
                          <BiPlusCircle className="text-success" /> Nạp tiền vào ví
                        </Link>

                        {userProfile?.role === 'admin' && (
                          <Link to="/admin" className="dropdown-item p-2 d-flex align-items-center gap-2 rounded hover-bg-light">
                            <BiShield className="text-primary" /> Trang quản trị
                          </Link>
                        )}

                        <div className="border-top mt-2 pt-2">
                          <button onClick={handleLogout} className="dropdown-item p-2 d-flex align-items-center gap-2 rounded text-danger hover-bg-danger-light">
                            <BiLogOut /> Đăng xuất
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link to="/login" className="btn btn-sm tet-button-shop py-2 px-4 rounded-pill shadow-sm">
                  <BiUser className="me-1" /> ĐĂNG NHẬP
                </Link>
              )}
            </li>
          </ul>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
