import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaDiscord } from 'react-icons/fa';
import { useData } from '../context/DataContext';

const Footer = () => {
  const { siteSettings, serverStatus } = useData();

  const socialLinks = [
    { icon: FaDiscord, href: siteSettings?.discord_url || 'https://discord.gg/buildnchill', label: 'Discord' }
  ];

  return (
    <motion.footer
      className="footer"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-4 col-md-6 mb-4">
            <h5>{siteSettings?.site_title || 'BuildnChill'}</h5>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '1.5rem' }}>
              Server Minecraft cộng đồng thân thiện của chúng tôi. Xây dựng, khám phá và thư giãn cùng chúng tôi!
              Tham gia cộng đồng sôi động và trải nghiệm gameplay Minecraft tuyệt vời nhất.
            </p>
            <div className="social-icons">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    style={{
                      background: 'linear-gradient(135deg, #D70018 0%, #FFD700 100%)',
                      color: 'white',
                      padding: '8px',
                      borderRadius: '50%',
                      display: 'inline-flex',
                      border: '3px solid #FFD700',
                      boxShadow: '0 0 20px rgba(215, 0, 24, 0.6), 0 0 10px rgba(255, 215, 0, 0.4)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Icon size={24} />
                  </motion.a>
                );
              })}
            </div>
          </div>
          <div className="col-lg-2 col-md-6 mb-4">
            <h5>Liên Kết Nhanh</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/">Trang Chủ</Link>
              </li>
              <li className="mb-2">
                <Link to="/about">Giới Thiệu</Link>
              </li>
              <li className="mb-2">
                <Link to="/news">Tin Tức</Link>
              </li>
              <li className="mb-2">
                <Link to="/shop">Cửa Hàng</Link>
              </li>
              <li className="mb-2">
                <Link to="/contact">Liên Hệ</Link>
              </li>
            </ul>
          </div>
          <div className="col-lg-3 col-md-6 mb-4">
            <h5 style={{ color: '#FFD700', textShadow: '0 0 10px rgba(255, 215, 0, 0.4)' }}>Thông Tin Server</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <strong style={{ color: '#FFD700', fontSize: '1rem' }}>IP:</strong>
                <span style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  color: '#FFFDF0',
                  textShadow: '0 0 5px rgba(255, 215, 0, 0.2)',
                  marginLeft: '0.5rem'
                }}>{siteSettings?.server_ip || 'play.buildnchill.com'}</span>
              </li>
              <li className="mb-2">
                <strong style={{ color: '#FFD700' }}>Phiên Bản:</strong>
                <span style={{ marginLeft: '0.5rem', fontWeight: '700', color: '#FFFDF0' }}>
                  {serverStatus?.version || siteSettings?.server_version || '1.20.4'}
                </span>
              </li>
              <li className="mb-2">
                <strong style={{ color: '#FFD700' }}>Trạng Thái:</strong>
                <span style={{ marginLeft: '0.5rem', fontWeight: '700', color: serverStatus?.status === 'Online' ? '#10b981' : '#ef4444' }}>
                  {serverStatus?.status === 'Online' ? '🟢 Đang Hoạt Động' : '🔴 Bảo Trì'}
                </span>
              </li>
            </ul>
          </div>
          <div className="col-lg-3 col-md-6 mb-4">
            <h5 style={{ color: '#FFD700', textShadow: '0 0 10px rgba(255, 215, 0, 0.4)' }}>Liên Hệ</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <strong style={{ color: '#FFD700' }}>Email:</strong><br />
                <a href={`mailto:${siteSettings?.contact_email || 'contact@buildnchill.com'}`} style={{
                  color: '#FFFDF0',
                  textDecoration: 'none',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  textShadow: '0 0 5px rgba(255, 215, 0, 0.2)'
                }}>
                  {siteSettings?.contact_email || 'contact@buildnchill.com'}
                </a>
              </li>
              <li className="mb-2">
                <strong style={{ color: '#FFD700' }}>Số Điện Thoại:</strong><br />
                <a href={`tel:${siteSettings?.contact_phone?.replace(/\s/g, '') || '+1234567890'}`} style={{
                  color: '#FFFDF0',
                  textDecoration: 'none',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  textShadow: '0 0 5px rgba(255, 215, 0, 0.2)'
                }}>
                  {siteSettings?.contact_phone || '+1 (234) 567-890'}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <hr style={{ borderColor: '#FFD700', margin: '2rem 0', borderWidth: '1px', opacity: 0.3 }} />

        <div className="text-center">
          <p className="mb-2" style={{
            color: '#FFFDF0',
            fontSize: '1.1rem',
            fontWeight: '700',
            textShadow: '0 0 10px rgba(255, 215, 0, 0.2)',
            letterSpacing: '1px'
          }}>
            &copy; {new Date().getFullYear()} {siteSettings?.site_title || 'BuildnChill'}. All rights reserved.
            <span style={{ color: '#FFD700', marginLeft: '0.5rem', textShadow: '0 0 15px rgba(255, 215, 0, 0.4)' }}>🧧 Chúc mừng năm mới Bính Ngọ 2026! 🌸</span>
          </p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ fontSize: '0.95rem', color: '#FFFDF0', fontWeight: '600' }}
          >
            Website được thiết kế và quản lý bởi <span style={{ color: '#FFD700', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 0 10px rgba(255, 215, 0, 0.3)' }}>T-Dev29</span>
          </motion.div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;