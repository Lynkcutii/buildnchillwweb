import { useState } from 'react';
import { motion } from 'framer-motion';
import { BiPhone, BiEnvelope, BiServer, BiCopyAlt } from 'react-icons/bi';
import { FaDiscord } from 'react-icons/fa';
import { useData } from '../context/DataContext';

const TopBar = () => {
  const { siteSettings } = useData();
  const [copied, setCopied] = useState('');

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  return (
    <motion.div
      className="top-bar"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container">
        <div className="d-flex justify-content-between align-items-center flex-wrap">
          <div className="d-flex gap-4 flex-wrap">
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <BiPhone className="me-2" />
              <a href={`tel:${siteSettings?.contact_phone?.replace(/\s/g, '') || '+1234567890'}`}>
                {siteSettings?.contact_phone || '+1 (234) 567-890'}
              </a>
            </motion.span>
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <BiEnvelope className="me-2" />
              <a href={`mailto:${siteSettings?.contact_email || 'contact@buildnchill.com'}`}>
                {siteSettings?.contact_email || 'contact@buildnchill.com'}
              </a>
            </motion.span>
          </div>
          <div className="d-flex gap-4 flex-wrap">
            <motion.span
              className="copy-btn"
              onClick={() => copyToClipboard(siteSettings?.server_ip || 'play.buildnchill.com', 'ip')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <BiServer className="me-2" />
              {siteSettings?.server_ip || 'play.buildnchill.com'}
              {copied === 'ip' && (
                <motion.span
                  className="ms-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{ color: 'var(--tet-lucky-red)' }}
                >
                  ✓ Đã Sao Chép!
                </motion.span>
              )}
            </motion.span>
            <motion.a
              href={siteSettings?.discord_url || 'https://discord.gg/buildnchill'}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaDiscord className="me-2" />
              Tham Gia Discord
            </motion.a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TopBar;
