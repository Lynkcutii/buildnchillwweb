import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useData } from '../context/DataContext';
import { BiSearch, BiCalendar } from 'react-icons/bi';

const News = () => {
  const { news } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const filteredNews = news.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredPost = filteredNews[0];

  const olderPosts = filteredNews.slice(1);

  const totalPages = Math.ceil(olderPosts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPosts = olderPosts.slice(startIndex, endIndex);

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="shop-tet-container">
      <Helmet>
        <title>Tin Tức & Sự Kiện - BuildnChill Minecraft</title>
        <meta name="description" content="Cập nhật những tin tức mới nhất, sự kiện hấp dẫn và các bản cập nhật quan trọng từ máy chủ Minecraft BuildnChill." />
        <meta property="og:title" content="Tin Tức & Sự Kiện - BuildnChill" />
        <meta property="og:description" content="Đừng bỏ lỡ các thông tin quan trọng về cộng đồng Minecraft BuildnChill." />
        <meta property="og:image" content="https://foodtek.vn/sites/default/files/2025-12/467459402_525799813831572_2048064753693338637_n.webp" />
        <meta name="keywords" content="tin tuc minecraft, su kien minecraft, buildnchill news" />
      </Helmet>
      <div className="container my-5">
        <motion.h1
          className="tet-title mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Tin Tức
        </motion.h1>

        <motion.div
          className="search-bar tet-glass mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="d-flex align-items-center">
            <BiSearch size={24} style={{ color: 'var(--tet-lucky-red)', marginRight: '1rem' }} />
            <input
              type="text"
              className="tet-input"
              placeholder="Tìm kiếm tin tức..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </motion.div>

        {featuredPost && (
          <motion.div
            className="mb-5"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="card tet-glass">
              <div className="row g-0">
                <div className="col-md-4">
                  <motion.img
                    src={featuredPost.image}
                    className="img-fluid rounded-start"
                    alt={featuredPost.title}
                    style={{ height: '100%', objectFit: 'cover', minHeight: '300px' }}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="col-md-8">
                  <div className="card-body p-4">
                    <h2 className="card-title news-title-truncate" style={{ color: 'var(--tet-lucky-red-dark)', marginBottom: '1rem', fontWeight: 700 }}>
                      {featuredPost.title}
                    </h2>
                    <p className="text-muted mb-3" style={{ color: 'var(--tet-text-charcoal)' }}>
                      <BiCalendar className="me-1" />
                      {new Date(featuredPost.date).toLocaleDateString('vi-VN')}
                    </p>
                    <p className="card-text news-description-truncate" style={{ color: 'var(--tet-text-charcoal)', fontSize: '1.1rem', fontWeight: 500 }}>
                      {featuredPost.description}
                    </p>
                    <Link to={`/news/${featuredPost.slug}`} className="tet-button mt-3">
                      Đọc Thêm
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <h3 className="tet-section-title mb-4">
            Tất Cả Bài Viết
          </h3>
          <div className="row g-4">
            {paginatedPosts.map((post) => (
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
                    style={{ height: '200px', objectFit: 'cover' }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  />
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title news-title-truncate" style={{ color: 'var(--tet-text-dark)', fontWeight: 700 }}>
                      {post.title}
                    </h5>
                    <p className="text-muted small mb-2" style={{ color: 'var(--tet-text-charcoal)' }}>
                      <BiCalendar className="me-1" />
                      {new Date(post.date).toLocaleDateString('vi-VN')}
                    </p>
                    <p className="card-text news-description-truncate" style={{ color: 'var(--tet-text-charcoal)', fontWeight: 500, flex: 1 }}>
                      {post.description}
                    </p>
                    <div className="mt-auto">
                      <Link to={`/news/${post.slug}`} className="tet-button w-100 text-center">
                        Đọc Thêm
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {totalPages > 1 && (
          <motion.div
            className="pagination-controls mt-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button
              className="tet-button-outline me-3"
              onClick={handlePrevious}
              disabled={currentPage === 1}
              whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
              whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
              style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              Trước
            </motion.button>
            <span className="align-self-center mx-3" style={{ color: 'var(--tet-text-charcoal)', fontWeight: 600 }}>
              Trang {currentPage} / {totalPages}
            </span>
            <motion.button
              className="tet-button-outline"
              onClick={handleNext}
              disabled={currentPage === totalPages}
              whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }}
              whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
              style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              Sau
            </motion.button>
          </motion.div>
        )}

        {filteredNews.length === 0 && (
          <motion.div
            className="text-center py-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p style={{ color: 'var(--tet-text-charcoal)', fontSize: '1.2rem', fontWeight: 600 }}>Không tìm thấy tin tức nào phù hợp với tìm kiếm của bạn.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default News;
