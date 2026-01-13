import { useState } from 'react';
import { motion } from 'framer-motion';
import { BiUser, BiEnvelope, BiPhone, BiMessageSquare, BiSend, BiImageAdd, BiX } from 'react-icons/bi';
import { useData } from '../context/DataContext';

const Contact = () => {
  const { submitContact } = useData();
  const [formData, setFormData] = useState({
    ign: '',
    email: '',
    phone: '',
    category: '',
    message: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { value: 'report', label: 'Báo Cáo (Report)' },
    { value: 'help', label: 'Trợ Giúp (Help)' },
    { value: 'bug', label: 'Báo Lỗi (Bug)' },
    { value: 'suggestion', label: 'Đề Xuất (Suggestion)' },
    { value: 'other', label: 'Khác (Other)' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh!');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước ảnh không được vượt quá 5MB!');
        return;
      }
      setFormData({
        ...formData,
        image: file
      });
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData({
      ...formData,
      image: null
    });
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setUploading(true);

    try {
      const success = await submitContact(formData);
      if (success) {
        alert('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể. 🎊');
        setFormData({
          ign: '',
          email: '',
          phone: '',
          category: '',
          message: '',
          image: null
        });
        setImagePreview(null);
        // Reset file input
        const fileInput = document.getElementById('image');
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      console.error('Error submitting contact:', error);
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const formFields = [
    { name: 'ign', label: 'Tên Trong Game (IGN)', icon: BiUser, type: 'text', required: true },
    { name: 'email', label: 'Email', icon: BiEnvelope, type: 'email', required: true },
    { name: 'phone', label: 'Số Điện Thoại', icon: BiPhone, type: 'tel', required: false }
  ];

  return (
    <div className="shop-tet-container">
      <div className="container my-5">
        <motion.div
          className="row"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="col-lg-8 mx-auto">
            <motion.h1
              className="tet-title mb-4 text-center"
            >
              Liên Hệ Chúng Tôi
            </motion.h1>
            <motion.p
              className="mb-5 text-center"
              style={{ color: 'var(--tet-text-charcoal)', fontSize: '1.1rem' }}
            >
              🧧 Có câu hỏi hoặc cần hỗ trợ? Điền vào biểu mẫu bên dưới và chúng tôi sẽ phản hồi sớm nhất có thể. 🧧
            </motion.p>

            <motion.form
              onSubmit={handleSubmit}
              className="tet-glass p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {formFields.map((field, index) => {
                const Icon = field.icon;
                return (
                  <motion.div
                    key={field.name}
                    className="mb-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <label htmlFor={field.name} className="tet-label">
                      <Icon className="me-2" style={{ color: 'var(--tet-lucky-red)' }} />
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      className="tet-input"
                      id={field.name}
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleChange}
                      placeholder={field.label}
                      required={field.required}
                    />
                  </motion.div>
                );
              })}

              <motion.div
                className="mb-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label htmlFor="category" className="tet-label">
                  <BiMessageSquare className="me-2" style={{ color: 'var(--tet-lucky-red)' }} />
                  Danh Mục
                </label>
                <select
                  className="tet-select"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </motion.div>

              <motion.div
                className="mb-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <label htmlFor="message" className="tet-label">
                  <BiMessageSquare className="me-2" style={{ color: 'var(--tet-lucky-red)' }} />
                  Tin Nhắn
                </label>
                <textarea
                  className="tet-input"
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Nhập tin nhắn của bạn..."
                  rows="5"
                  required
                  style={{ minHeight: '150px', resize: 'vertical' }}
                ></textarea>
              </motion.div>

              <motion.div
                className="mb-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <label htmlFor="image" className="tet-label">
                  <BiImageAdd className="me-2" style={{ color: 'var(--tet-lucky-red)' }} />
                  Tải Ảnh Lên (Tùy chọn)
                </label>
                <input
                  type="file"
                  className="tet-input"
                  id="image"
                  name="image"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <small className="form-text" style={{ color: '#999999' }}>
                  Chỉ chấp nhận file ảnh, kích thước tối đa 5MB
                </small>
                {imagePreview && (
                  <div className="mt-4">
                    <motion.div 
                      className="position-relative d-inline-block" 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          maxWidth: '100%',
                          width: '200px',
                          height: '150px',
                          objectFit: 'cover',
                          borderRadius: '12px',
                          display: 'block',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                          border: '3px solid white'
                        }}
                      />
                      <motion.button
                        type="button"
                        onClick={handleRemoveImage}
                        className="position-absolute shadow"
                        style={{
                          top: '-10px',
                          right: '-10px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: '#D70018',
                          color: 'white',
                          border: '2px solid white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          cursor: 'pointer',
                          zIndex: 5
                        }}
                        whileHover={{ scale: 1.1, backgroundColor: '#FF0000' }}
                        whileTap={{ scale: 0.9 }}
                        title="Xóa ảnh"
                      >
                        <i className="bi bi-x-lg" style={{ fontSize: '12px', WebkitTextStroke: '1px' }}></i>
                      </motion.button>
                    </motion.div>
                  </div>
                )}
              </motion.div>

              <motion.button
                type="submit"
                className="tet-button w-100"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={submitting || uploading}
                style={{ opacity: (submitting || uploading) ? 0.7 : 1 }}
              >
                <BiSend className="me-2" />
                {(submitting || uploading) ? 'Đang Gửi...' : 'Gửi Tin Nhắn'}
              </motion.button>
            </motion.form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
