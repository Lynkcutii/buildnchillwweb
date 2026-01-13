import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { BiArrowBack, BiCalendar } from 'react-icons/bi';
import 'react-quill/dist/quill.snow.css';

const NewsDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { news } = useData();
  const [post, setPost] = useState(null);

  useEffect(() => {
    const foundPost = news.find(p => p.slug === slug || p.id.toString() === slug);
    if (foundPost) {
      setPost(foundPost);
    } else if (news.length > 0) {
      navigate('/news');
    }
  }, [slug, navigate, news]);

  if (!post) {
    return (
      <div className="container my-5">
        <div className="text-center">
          <div className="spinner-neon mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-tet-container">
      <div className="container my-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/news" className="tet-button-outline mb-4 d-inline-flex align-items-center">
              <BiArrowBack className="me-2" />
              Quay Lại Tin Tức
            </Link>
          </motion.div>

          <article className="tet-glass p-4">
            <div className="news-image-container mb-4">
              <motion.img
                src={post.image}
                className="img-fluid rounded"
                alt={post.title}
                style={{
                  maxHeight: '600px',
                  width: '100%',
                  objectFit: 'contain',
                  border: '3px solid #FFD700',
                  background: 'rgba(215, 0, 24, 0.05)'
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              />
            </div>
            <motion.h1
              className="tet-title"
              style={{
                marginBottom: '1rem'
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {post.title}
            </motion.h1>
            <motion.p
              className="mb-4"
              style={{ color: 'var(--tet-text-charcoal)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <BiCalendar className="me-2" style={{ color: 'var(--tet-lucky-red)' }} />
              {new Date(post.date).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </motion.p>
            <motion.div
              className="news-content ql-snow ql-editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              dangerouslySetInnerHTML={{ __html: post.content }}
              style={{ padding: 0 }}
            />
          </article>
        </motion.div>
      </div>
    </div>
  );
};

export default NewsDetail;
