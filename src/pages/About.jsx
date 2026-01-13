import { motion } from 'framer-motion';
import { BiServer, BiCube, BiGroup, BiTrophy, BiShield, BiHeart } from 'react-icons/bi';
import { useData } from '../context/DataContext';

const About = () => {
  const { siteSettings } = useData();
  const features = [
    { icon: BiServer, title: 'Hoạt Động 24/7', description: 'Server của chúng tôi luôn online và sẵn sàng cho bạn chơi.' },
    { icon: BiCube, title: 'Xây Dựng Sáng Tạo', description: 'Thể hiện kỹ năng xây dựng của bạn trong thế giới sáng tạo của chúng tôi.' },
    { icon: BiGroup, title: 'Cộng Đồng Năng Động', description: 'Tham gia cùng hàng nghìn người chơi từ khắp nơi trên thế giới.' },
    { icon: BiTrophy, title: 'Sự Kiện Thường Xuyên', description: 'Tham gia các cuộc thi xây dựng và sự kiện cộng đồng.' },
    { icon: BiShield, title: 'Môi Trường An Toàn', description: 'Không khoan nhượng với hành vi phá hoại và độc hại.' },
    { icon: BiHeart, title: 'Đội Ngũ Thân Thiện', description: 'Đội ngũ tận tâm của chúng tôi làm việc 24/7 để giúp đỡ bạn.' }
  ];

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
      transition: { duration: 0.6 }
    }
  };

  return (
    <div className="shop-tet-container">
      <div className="container my-5">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="row">
            <div className="col-lg-10 mx-auto">
              <motion.h1
                className="tet-title mb-4 text-center"
              >
                Giới Thiệu {siteSettings?.site_title || 'BuildnChill'}
              </motion.h1>

              <motion.div
                className="tet-glass p-4 mb-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="tet-section-title mb-3">Chào Mừng Đến Cộng Đồng Của Chúng Tôi</h3>
                <p style={{ color: 'var(--tet-text-charcoal)', fontSize: '1.1rem', lineHeight: '1.8', fontWeight: 500 }}>
                  {siteSettings?.site_title || 'BuildnChill'} là một server Minecraft thân thiện và chào đón, nơi người chơi ở mọi cấp độ kỹ năng
                  có thể cùng nhau xây dựng, khám phá và vui chơi. Sứ mệnh của chúng tôi là tạo ra một môi trường
                  game tích cực nơi sự sáng tạo phát triển và tình bạn được hình thành.
                </p>
              </motion.div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <h3 className="tet-section-title mb-4 text-center">
                  Những Gì Chúng Tôi Cung Cấp
                </h3>
                <div className="row g-4">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <motion.div
                        key={index}
                        className="col-md-6"
                        variants={itemVariants}
                        whileHover={{ scale: 1.05, y: -10 }}
                      >
                        <div className="card tet-glass h-100 p-4">
                          <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                          >
                            <Icon size={50} style={{ color: 'var(--tet-lucky-red)', marginBottom: '1rem' }} />
                          </motion.div>
                          <h5 style={{ color: 'var(--tet-lucky-red-dark)', marginBottom: '1rem', fontWeight: 700 }}>{feature.title}</h5>
                          <p style={{ color: 'var(--tet-text-charcoal)', fontWeight: 500 }}>{feature.description}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div
                className="tet-glass p-4 mt-5"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h3 className="tet-section-title mb-3">Giá Trị Của Chúng Tôi</h3>
                <p style={{ color: 'var(--tet-text-charcoal)', fontSize: '1.1rem', lineHeight: '1.8', fontWeight: 500 }}>
                  Tại {siteSettings?.site_title || 'BuildnChill'}, chúng tôi tin vào sự tôn trọng, sáng tạo và niềm vui. Chúng tôi có chính sách
                  không khoan nhượng với hành vi phá hoại, gian lận và độc hại. Đội ngũ nhân viên tận tâm của chúng tôi
                  làm việc 24/7 để đảm bảo mọi người có trải nghiệm tuyệt vời.
                </p>
              </motion.div>

              <motion.div
                className="tet-glass p-4 mt-4"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h3 className="tet-section-title mb-3">Tham Gia Ngay Hôm Nay</h3>
                <p style={{ color: 'var(--tet-text-charcoal)', fontSize: '1.1rem', lineHeight: '1.8', fontWeight: 500 }}>
                  Dù bạn là một người chơi Minecraft dày dạn kinh nghiệm hay chỉ mới bắt đầu hành trình, {siteSettings?.site_title || 'BuildnChill'}
                  chào đón bạn. Kết nối với server của chúng tôi tại <strong style={{ color: 'var(--tet-lucky-red-dark)' }}>{siteSettings?.server_ip || 'play.buildnchill.com'}</strong> và bắt đầu
                  cuộc phiêu lưu của bạn ngay hôm nay!
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
