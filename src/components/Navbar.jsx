import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BiHomeAlt, BiInfoCircle, BiNews, BiEnvelope, BiShield, BiShoppingBag } from 'react-icons/bi';
import { useData } from '../context/DataContext';

const Navbar = () => {
  const location = useLocation();
  const { siteSettings } = useData();

  useEffect(() => {
    const navbarNav = document.getElementById('navbarNav');
    if (navbarNav && navbarNav.classList.contains('show')) {
      const toggler = document.querySelector('.navbar-toggler');
      if (toggler) {
        toggler.click();
      }
    }
  }, [location]);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', label: 'Trang Chủ', icon: BiHomeAlt },
    { path: '/about', label: 'Giới Thiệu', icon: BiInfoCircle },
    { path: '/news', label: 'Tin Tức', icon: BiNews },
    { path: '/shop', label: 'Cửa Hàng', icon: BiShoppingBag },
    { path: '/contact', label: 'Liên Hệ', icon: BiEnvelope },
    { path: '/admin', label: 'Quản Trị', icon: BiShield }
  ];

  return (
    <motion.nav
      className="navbar navbar-expand-lg"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="container">
        <Link className="navbar-brand" to="/">
          {siteSettings?.site_title || 'BuildnChill'}
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.li
                  key={item.path}
                  className="nav-item"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Link
                    className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                    to={item.path}
                  >
                    <Icon className="me-1" />
                    {item.label}
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
