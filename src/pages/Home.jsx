import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { BiServer, BiUser, BiCalendar, BiTime, BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import '../styles/carousel.css';

const Home = () => {
  const { news, serverStatus, siteSettings } = useData();
  const [currentSlide, setCurrentSlide] = useState(0);

  const latestNews = news.slice(0, 3);
  
  const siteTitle = siteSettings?.site_title || 'BuildnChill';
  const serverIp = siteSettings?.server_ip || 'play.buildnchill.com';

  return (
    <div className="shop-tet-container">
      <Helmet>
        <title>{siteTitle} - Server Minecraft Việt Nam | {serverIp}</title>
        <meta name="description" content={`Chào mừng bạn đến với ${siteTitle}. Server Minecraft Việt Nam chất lượng với cộng đồng năng động, sự kiện thường xuyên và hỗ trợ 24/7. Tham gia ngay tại ${serverIp}`} />
        <meta property="og:title" content={`${siteTitle} - Server Minecraft Việt Nam`} />
        <meta property="og:description" content={`Tham gia cộng đồng Minecraft lớn mạnh nhất tại ${serverIp}. Nhiều chế độ chơi hấp dẫn đang chờ bạn!`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://buildnchill.com" />
        <meta property="og:image" content="https://foodtek.vn/sites/default/files/2025-12/2025-12-19_23.28.20.webp" />
        <meta name="keywords" content="minecraft, server minecraft, minecraft viet nam, buildnchill, play minecraft, minecraft 1.20.4" />
      </Helmet>

      {/* Carousel Section */}
      <section className="hero-carousel">
        <div className="carousel-container">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              className="carousel-slide"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              <img
                src={[
                  'https://media.discordapp.net/attachments/1318780761880658030/1459010017905737759/Generated_Image_January_09_2026_-_9_21AM_LE_upscale_balanced.jpg?ex=6961b877&is=696066f7&hm=8575353526785f2d034385187431d268de58b412681a9904bce0564360fccc93&=&format=webp&width=743&height=291',
                  'https://foodtek.vn/sites/default/files/2025-12/462570011_607189315167864_5786208777291669050_n.webp',
                  'https://foodtek.vn/sites/default/files/2025-12/467459402_525799813831572_2048064753693338637_n.webp',
                  'https://foodtek.vn/sites/default/files/2025-12/467457844_1958845277932349_4464426894527163495_n.webp',
                  'https://foodtek.vn/sites/default/files/2025-12/2025-02-17_21.42.55.webp',
                  'https://foodtek.vn/sites/default/files/2025-12/6-3_01.webp',
                  'https://foodtek.vn/sites/default/files/2025-12/2025-09-20_20.49.28.webp',
                  'https://foodtek.vn/sites/default/files/2025-12/2025-12-19_23.28.20.webp',
                  'https://foodtek.vn/sites/default/files/2025-12/2025-12-19_23.25.58.webp',
                  'https://foodtek.vn/sites/default/files/2025-12/17-915.webp'
                ][currentSlide]}
                alt={`Slide ${currentSlide + 1}`}
                className="carousel-image"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          className="carousel-btn carousel-btn-prev"
          onClick={() => setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)}
        >
          <BiChevronLeft size={30} />
        </button>

        <button
          className="carousel-btn carousel-btn-next"
          onClick={() => setCurrentSlide((prev) => (prev + 1) % carouselImages.length)}
        >
          <BiChevronRight size={30} />
        </button>
      </section>

      <div className="container my-5">
        <motion.section
          className="mb-5"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h2
            className="tet-title text-center mb-5"
            variants={itemVariants}
          >
            Tại Sao Chọn Chúng Tôi?
          </motion.h2>
          <div className="row g-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  className="col-md-4"
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, y: -10 }}
                >
                  <div className="card tet-glass text-center p-4 h-100">
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.2 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Icon size={60} style={{ color: 'var(--tet-lucky-red)', marginBottom: '1rem' }} />
                    </motion.div>
                    <h4 style={{ color: 'var(--tet-lucky-red-dark)', marginBottom: '1rem', fontWeight: 700 }}>{feature.title}</h4>
                    <p style={{ color: 'var(--tet-text-charcoal)' }}>{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          className="mb-5"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h2
            className="tet-section-title mb-4"
            variants={itemVariants}
          >
            Tin Tức Mới Nhất
          </motion.h2>
          <div className="row g-4">
            {latestNews.map((post, index) => (
              <motion.div
                key={post.id}
                className="col-md-4"
                variants={itemVariants}
                whileHover={{ y: -10 }}
              >
                <div className="card tet-glass h-100">
                  <motion.img
                    src={post.image}
                    className="card-img-top"
                    alt={post.title}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  />
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title news-title-truncate" style={{ color: '#1a1a1a', fontWeight: 700 }}>{post.title}</h5>
                    <p className="text-muted small mb-2">
                      <BiCalendar className="me-1" />
                      {new Date(post.date).toLocaleDateString('vi-VN')}
                    </p>
                    <p className="card-text news-description-truncate" style={{ color: '#4a4a4a', flex: 1 }}>
                      {post.description}
                    </p>
                    <div className="mt-auto">
                      <Link to={`/news/${post.id}`} className="tet-button w-100 text-center">
                        Đọc Thêm
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div
            className="text-center mt-4"
            variants={itemVariants}
          >
            <Link to="/news" className="tet-button-outline">
              Xem Tất Cả Tin Tức
            </Link>
          </motion.div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="tet-section-title mb-4">
            Trạng Thái Server
          </h2>
          {serverStatus && (
            <div className="server-status-card tet-glass p-4">
              <div className="row">
                <div className="col-md-4 col-sm-6 server-status-item">
                  <strong style={{ color: '#1a1a1a' }}>Trạng Thái</strong>
                  <div>
                    <motion.span
                      className={`badge ${serverStatus.status === 'Online' ? 'bg-success' : 'bg-danger'}`}
                      style={{
                        fontSize: '1rem',
                        padding: '0.5rem 1rem',
                        background: serverStatus.status === 'Online' ? 'var(--tet-lucky-red)' : 'var(--tet-lucky-red-dark)',
                        color: '#ffffff',
                        fontWeight: 700
                      }}
                    >
                      {serverStatus.status === 'Online' ? 'Đang Hoạt Động' : 'Đang Tắt'}
                    </motion.span>
                  </div>
                </div>
                <div className="col-md-4 col-sm-6 server-status-item">
                  <strong style={{ color: '#1a1a1a' }}>Người Chơi</strong>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--tet-lucky-red-dark)' }}>
                    {serverStatus.players} / {serverStatus.maxPlayers}
                  </div>
                </div>
                <div className="col-md-4 col-sm-6 server-status-item">
                  <strong style={{ color: '#1a1a1a' }}>Phiên Bản</strong>
                  <div style={{ fontSize: '1.2rem', color: '#1a1a1a', fontWeight: 600 }}>{serverStatus?.version || siteSettings?.server_version || '1.20.4'}</div>
                </div>
              </div>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
};

export default Home;
