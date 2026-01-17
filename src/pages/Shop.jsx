import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { BiShoppingBag, BiUser, BiCheckCircle, BiXCircle, BiGift, BiQrScan, BiCreditCard, BiStar, BiCalendar } from 'react-icons/bi';
import { supabase } from '../supabaseClient';
import TetEffect from '../components/TetEffect';
import TetDatePicker from '../components/TetDatePicker';
import '../styles/shop-tet.css';
import { QRCodeCanvas } from 'qrcode.react';

const Shop = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const formRef = useRef(null);
  const [formData, setFormData] = useState({
    mc_username: '',
    product_id: '',
    payment_method: 'qr'
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [topDonators, setTopDonators] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [loadingTop, setLoadingTop] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState({
    qr_code: '',
    bank_account: '0379981206',
    bank_name: 'MBBank',
    account_name: 'LE DUC TRONG'
  });
  const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1458351729023254529/TldcZM4HKMyELK9ZICAO8WXQDcG6vqCtYeSXJZ7NqXRWf1fZP_MRAjfjfkx-qgOrLJgS';

  const sendDiscordNotification = async (order, customTitle) => {
    if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL.includes('Thay bằng URL thật')) return null;

    try {
      const isSuccess = customTitle === 'THANH TOÁN THÀNH CÔNG';
      const embed = {
        title: `🛒 ${customTitle || 'ĐƠN HÀNG MỚI'}`,
        description: `🔔 <@741299302495813662> ${isSuccess ? 'Người chơi đã xác nhận đã thanh toán xong! Admin vui lòng kiểm tra ngân hàng.' : 'Có một đơn hàng mới vừa được khởi tạo trên hệ thống!'}`,
        color: 16766720,
        fields: [
          { name: '👤 Người chơi', value: order.mc_username || 'Không rõ', inline: true },
          { name: '📦 Sản phẩm', value: order.product || 'Không rõ', inline: true },
          { name: '💰 Giá tiền', value: `${Number(order.price || 0).toLocaleString('vi-VN')} VNĐ`, inline: true },
          { name: '💳 Thanh toán', value: order.payment_method === 'qr' ? 'QR Code' : 'Chuyển Khoản', inline: true },
          { name: '🆔 Mã đơn hàng', value: `\`${order.id || 'N/A'}\`` },
          { name: '📜 Lệnh thực thi', value: `\`${order.command || 'N/A'}\`` }
        ],
        footer: { text: 'BuildnChill Shop System' },
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`${DISCORD_WEBHOOK_URL}?wait=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🔔 <@741299302495813662> **${isSuccess ? 'XÁC NHẬN THANH TOÁN' : 'ĐƠN HÀNG MỚI'}**`,
          embeds: [embed]
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.id;
      }
      return null;
    } catch (error) {
      console.error('Error sending Discord notification:', error);
      return null;
    }
  };

  useEffect(() => {
    loadCategories();
    loadProducts();
    loadTopDonators();
  }, [dateRange]);

  const loadTopDonators = async () => {
    setLoadingTop(true);
    try {
      let query = supabase
        .from('orders')
        .select('mc_username, price, created_at, status, delivered')
        .eq('is_deleted', false)
        .or('status.eq.paid,status.eq.delivered,delivered.eq.true');

      if (dateRange.start) {
        query = query.gte('created_at', `${dateRange.start}T00:00:00`);
      }
      if (dateRange.end) {
        query = query.lte('created_at', `${dateRange.end}T23:59:59`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const userSpending = {};
      data.forEach(order => {
        const username = order.mc_username || 'Ẩn danh';
        userSpending[username] = (userSpending[username] || 0) + (order.price || 0);
      });

      const sorted = Object.entries(userSpending)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total);

      // Tính toán thứ hạng (có xử lý đồng hạng)
      let currentRank = 0;
      let lastTotal = -1;
      const ranked = sorted.map((user, index) => {
        if (user.total !== lastTotal) {
          currentRank = index + 1;
          lastTotal = user.total;
        }
        return { ...user, rank: currentRank };
      }).slice(0, 10); // Lấy top 10 để hiển thị được nhiều hơn nếu có đồng hạng, hoặc vẫn giữ 5 tùy ý. 
      // User yêu cầu top 4-5 nên tôi sẽ lấy ít nhất 5.

      setTopDonators(ranked.slice(0, 5));
    } catch (error) {
      console.error('Error loading top donators:', error);
    } finally {
      setLoadingTop(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('active', true)
        .eq('is_deleted', false)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
      if (data && data.length > 0 && !selectedCategory) {
        setSelectedCategory(data[0].id);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .eq('is_deleted', false)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const stripHtml = (html) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category_id === selectedCategory)
    : products;

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedProduct(null);
    setFormData({ ...formData, product_id: '' });
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setFormData({ ...formData, product_id: product.id });

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.mc_username.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên Minecraft của bạn!' });
      return;
    }

    if (!formData.product_id) {
      setMessage({ type: 'error', text: 'Vui lòng chọn sản phẩm!' });
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const product = products.find(p => p.id === formData.product_id);
      if (!product) {
        setMessage({ type: 'error', text: 'Sản phẩm không hợp lệ!' });
        setSubmitting(false);
        return;
      }

      // Tạo đối tượng đơn hàng tạm thời (chưa lưu vào database)
      // Sử dụng crypto.randomUUID() để tạo ID duy nhất cho nội dung thanh toán
      const tempId = crypto.randomUUID();
      const newOrder = {
        id: tempId,
        mc_username: formData.mc_username.trim(),
        product: product.name,
        product_id: product.id,
        category_id: product.category_id,
        command: product.command.replace('{username}', formData.mc_username.trim()).replace('{user_name}', formData.mc_username.trim()),
        price: product.price,
        status: 'pending',
        delivered: false,
        payment_method: formData.payment_method
      };

      localStorage.setItem('last_mc_username', formData.mc_username.trim());
      setCurrentOrder(newOrder);
      setShowPayment(true);
      setMessage({
        type: 'success',
        text: 'Vui lòng hoàn tất thanh toán trong bảng hiện ra!'
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      setMessage({
        type: 'error',
        text: 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau!'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentComplete = async () => {
    if (!currentOrder || submitting) return;

    setSubmitting(true);
    try {
      // 1. Chỉ lưu đơn hàng vào database KHI người dùng bấm xác nhận đã thanh toán
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            id: currentOrder.id,
            mc_username: currentOrder.mc_username,
            product: currentOrder.product,
            product_id: currentOrder.product_id,
            category_id: currentOrder.category_id,
            command: currentOrder.command,
            price: currentOrder.price,
            status: 'pending',
            delivered: false,
            payment_method: currentOrder.payment_method,
            notes: 'Người chơi đã bấm nút "Đã Thanh Toán" trên web'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // 2. Gửi thông báo Discord
      const messageId = await sendDiscordNotification(data, 'THANH TOÁN THÀNH CÔNG');

      // 3. Cập nhật messageId vào notes nếu có
      if (messageId) {
        await supabase
          .from('orders')
          .update({
            notes: `Người chơi đã bấm nút "Đã Thanh Toán" trên web [msg_id:${messageId}]`
          })
          .eq('id', data.id);
      }

      setShowPayment(false);
      setShowSuccess(true);
      setFormData({ mc_username: '', product_id: '', payment_method: 'qr' });
      setSelectedProduct(null);
      setCurrentOrder(null);
    } catch (error) {
      console.error('Error completing payment:', error);
      alert('Có lỗi xảy ra khi gửi đơn hàng. Vui lòng thử lại hoặc liên hệ Admin!');
    } finally {
      setSubmitting(false);
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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const setDatePreset = (preset) => {
    const now = new Date();
    let start = new Date();
    const end = now.toISOString().split('T')[0];

    if (preset === 'week') {
      start.setDate(now.getDate() - 7);
    } else if (preset === 'month') {
      start.setMonth(now.getMonth() - 1);
    } else if (preset === 'year') {
      start.setFullYear(now.getFullYear() - 1);
    } else if (preset === 'all') {
      start = new Date('2024-01-01'); // Early enough date
    }

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end
    });
  };

  return (
    <div className="shop-tet-container">
      <Helmet>
        <title>Cửa Hàng Minecraft - BuildnChill</title>
        <meta name="description" content="Mua sắm vật phẩm Minecraft, Rank, Xu và nhiều gói quà hấp dẫn tại BuildnChill Shop. Thanh toán nhanh chóng, nhận quà tức thì." />
        <meta property="og:title" content="Cửa Hàng Minecraft - BuildnChill Shop" />
        <meta property="og:description" content="Nâng cấp trải nghiệm chơi game của bạn với các vật phẩm độc quyền tại BuildnChill." />
        <meta property="og:image" content="https://foodtek.vn/sites/default/files/2025-12/462570011_607189315167864_5786208777291669050_n.webp" />
        <meta name="keywords" content="shop minecraft, mua rank minecraft, nap xu minecraft, buildnchill shop" />
      </Helmet>
      <TetEffect />
      <div className="container my-5">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1
            className="tet-title mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <BiShoppingBag className="me-2" style={{ display: 'inline-block' }} />
            Cửa Hàng Minecraft
          </motion.h1>
          <motion.p
            className="tet-subtitle mb-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            🧧 Mua sắm đầu năm, rước lộc đầy kho! 🧧
          </motion.p>

          <AnimatePresence>
            {showPayment && currentOrder && (
              <motion.div
                className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 9999 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPayment(false)}
              >
                <motion.div
                  className="tet-glass-strong p-4"
                  style={{ maxWidth: '500px', width: '90%' }}
                  initial={{ scale: 0.8, y: 50 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.8, y: 50 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="tet-section-title mb-3">
                    <BiCreditCard /> Thanh Toán
                  </h3>

                  <div className="mb-3">
                    <strong style={{ color: 'var(--tet-lucky-red-dark)' }}>Sản phẩm:</strong> {currentOrder.product}
                  </div>
                  {products.find(p => p.id === currentOrder.product_id)?.description && (
                    <div className="mb-3 product-description-full ql-snow" style={{ fontSize: '0.9rem', borderTop: '1px solid rgba(215, 0, 24, 0.1)', paddingTop: '10px' }}>
                      <div className="ql-editor p-0" dangerouslySetInnerHTML={{ __html: products.find(p => p.id === currentOrder.product_id).description }} />
                    </div>
                  )}
                  <div className="mb-3">
                    <strong style={{ color: 'var(--tet-lucky-red-dark)' }}>Giá:</strong> {currentOrder.price?.toLocaleString('vi-VN')} VNĐ
                  </div>

                  {formData.payment_method === 'qr' ? (
                    <div className="text-center mb-3">
                      <p className="mb-2">Quét mã QR để thanh toán:</p>
                      <div className="d-flex justify-content-center mb-3">
                        <img
                          src={`https://img.vietqr.io/image/MB-${paymentInfo.bank_account}-compact2.png?amount=${currentOrder.price}&addInfo=${currentOrder.id.substring(0, 8)}&accountName=${paymentInfo.account_name}`}
                          alt="VietQR Payment"
                          style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 4px 12px rgba(215,0,24,0.1)' }}
                        />
                      </div>
                      <p className="small text-muted">Tự động điền số tiền và nội dung chuyển khoản</p>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <p className="mb-2"><strong>Thông tin chuyển khoản:</strong></p>
                      <div className="p-3" style={{ background: 'rgba(215, 0, 24, 0.05)', borderRadius: '8px', border: '1px solid var(--tet-lucky-red)' }}>
                        <p className="mb-1"><strong>Ngân hàng:</strong> {paymentInfo.bank_name}</p>
                        <p className="mb-1"><strong>Số tài khoản:</strong> {paymentInfo.bank_account}</p>
                        <p className="mb-0"><strong>Chủ tài khoản:</strong> {paymentInfo.account_name}</p>
                        <p className="mb-0 mt-2"><strong>Số tiền:</strong> {currentOrder.price?.toLocaleString('vi-VN')} VNĐ</p>
                        <p className="mb-0"><strong>Nội dung:</strong> {currentOrder.id.substring(0, 8)}</p>
                      </div>
                    </div>
                  )}

                  <div className="d-flex gap-2">
                    <motion.button
                      className="tet-button-shop"
                      onClick={handlePaymentComplete}
                      disabled={submitting}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {submitting ? 'Đang Xử Lý...' : 'Đã Thanh Toán'}
                    </motion.button>
                    <motion.button
                      className="tet-button-outline"
                      onClick={() => setShowPayment(false)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Hủy
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showSuccess && (
              <motion.div
                className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 9999 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSuccess(false)}
              >
                <motion.div
                  className="tet-glass p-5 text-center"
                  style={{ maxWidth: '500px', width: '90%' }}
                  initial={{ scale: 0.8, y: 50 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.8, y: 50 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, delay: 0.2 }}>
                    <BiCheckCircle size={100} color="var(--tet-lucky-red)" className="mb-4" />
                  </motion.div>
                  <h2 className="tet-title mb-3" style={{ fontSize: '2rem' }}>Thanh Toán Thành Công!</h2>
                  <p className="mb-4" style={{ fontSize: '1.1rem', color: 'var(--tet-text-charcoal)' }}>
                    Cảm ơn bạn đã mua sắm tại BuildnChill. <br />
                    Chúc bạn một năm mới Bính Ngọ an khang thịnh vượng!
                  </p>
                  <motion.button className="tet-button-shop" onClick={() => setShowSuccess(false)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    Đóng
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="row g-4">
            <div className="col-lg-2 mb-4">
              <div className="tet-glass p-3 sticky-top" style={{ top: '100px', zIndex: 10 }}>
                <h5 className="tet-section-title mb-4" style={{ fontSize: '1.2rem' }}>
                  Danh Mục
                </h5>
                <div className="d-flex flex-column gap-2">
                  {categories.map(cat => (
                    <motion.button
                      key={cat.id}
                      className={`tet-category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                      onClick={() => handleCategoryChange(cat.id)}
                      whileTap={{ scale: 0.95 }}
                      style={{ padding: '10px 15px', fontSize: '0.9rem' }}
                    >
                      {cat.name.includes('VIP') ? '👑' : cat.name.includes('ITEM') ? '📦' : '🏮'} {cat.name}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-lg-7">
              <div className="row g-4 mb-5">
                {filteredProducts.map(product => (
                  <div key={product.id} className="col-md-6">
                    <motion.div
                      className={`tet-product-card ${selectedProduct?.id === product.id ? 'selected' : ''}`}
                      onClick={() => handleProductSelect(product)}
                      style={{ border: selectedProduct?.id === product.id ? '2px solid var(--tet-lucky-red)' : '' }}
                    >
                      <div className="product-image-wrapper">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} />
                        ) : (
                          <div className="d-flex align-items-center justify-content-center h-100 bg-light w-100">
                            <BiShoppingBag size={50} className="text-muted" />
                          </div>
                        )}
                      </div>

                      <div className="product-info-container">
                        <div>
                          <div className="category-badge-mini">
                            {categories.find(c => c.id === product.category_id)?.name || 'Currency'}
                          </div>

                          <h4 style={{ color: 'var(--tet-lucky-red-dark)', fontWeight: 800, fontSize: '1.1rem', margin: '5px 0' }}>
                            {product.name}
                          </h4>
                          {product.description && (
                            <p style={{ 
                              fontSize: '0.8rem', 
                              color: 'var(--tet-text-charcoal)', 
                              opacity: 0.8,
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              marginBottom: '10px'
                            }}>
                              {stripHtml(product.description)}
                            </p>
                          )}
                        </div>

                        <div>
                          <div className="product-price-display" style={{ fontSize: '1.2rem' }}>
                            {product.price?.toLocaleString('vi-VN')} VNĐ
                          </div>

                          <motion.button
                            className="tet-button-shop py-2"
                            style={{ fontSize: '0.9rem' }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            CHỌN MUA
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </div>

              <AnimatePresence>
                {selectedProduct && (
                  <motion.div ref={formRef} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="tet-glass p-4">
                    <h3 className="tet-section-title mb-4">
                      <BiUser /> Thông Tin Nhận Quà
                    </h3>
                    <div className="tet-preview mb-4">
                      <div className="row align-items-center">
                        <div className="col-md-8">
                          <h5 className="mb-1" style={{ color: 'var(--tet-lucky-red-dark)' }}>{selectedProduct.name}</h5>
                          <p className="mb-0 text-muted">Giá: {selectedProduct.price?.toLocaleString('vi-VN')} VNĐ</p>
                        </div>
                        <div className="col-md-4 text-md-end">
                          <BiGift size={40} color="var(--tet-lucky-red)" />
                        </div>
                      </div>
                      {selectedProduct.description && (
                        <div className="mt-3 pt-3 border-top product-description-full ql-snow" style={{ fontSize: '0.95rem' }}>
                          <div className="ql-editor p-0" dangerouslySetInnerHTML={{ __html: selectedProduct.description }} />
                        </div>
                      )}
                    </div>
                    <form onSubmit={handleSubmit}>
                      <div className="mb-4">
                        <label className="tet-label">Tên Nhân Vật (Minecraft IGN):</label>
                        <input type="text" name="mc_username" className="tet-input" placeholder="Ví dụ: Stevee" value={formData.mc_username} onChange={handleChange} required />
                      </div>
                      <div className="mb-4">
                        <label className="tet-label">Phương Thức Thanh Toán:</label>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <motion.div
                              className={`tet-card p-4 text-center cursor-pointer h-100 d-flex flex-column align-items-center justify-content-center ${formData.payment_method === 'qr' ? 'selected' : ''}`}
                              onClick={() => setFormData({ ...formData, payment_method: 'qr' })}
                              whileHover={{ y: -5 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <BiQrScan size={40} className="mb-2" style={{ color: formData.payment_method === 'qr' ? 'var(--tet-lucky-red)' : 'var(--tet-lucky-red-dark)' }} />
                              <div style={{ fontWeight: 700, fontSize: '1rem', color: formData.payment_method === 'qr' ? 'var(--tet-lucky-red)' : 'var(--tet-lucky-red-dark)' }}>Mã QR (Tự động)</div>
                            </motion.div>
                          </div>
                          <div className="col-md-6">
                            <motion.div
                              className={`tet-card p-4 text-center cursor-pointer h-100 d-flex flex-column align-items-center justify-content-center ${formData.payment_method === 'bank' ? 'selected' : ''}`}
                              onClick={() => setFormData({ ...formData, payment_method: 'bank' })}
                              whileHover={{ y: -5 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <BiCreditCard size={40} className="mb-2" style={{ color: formData.payment_method === 'bank' ? 'var(--tet-lucky-red)' : 'var(--tet-lucky-red-dark)' }} />
                              <div style={{ fontWeight: 700, fontSize: '1rem', color: formData.payment_method === 'bank' ? 'var(--tet-lucky-red)' : 'var(--tet-lucky-red-dark)' }}>Chuyển Khoản Thủ Công</div>
                            </motion.div>
                          </div>
                        </div>
                      </div>
                      {message.text && (
                        <div className={`tet-message ${message.type === 'error' ? 'error' : 'success'} mb-4`}>
                          {message.type === 'error' ? <BiXCircle size={20} /> : <BiCheckCircle size={20} />}
                          {message.text}
                        </div>
                      )}
                      <motion.button type="submit" className="tet-button-shop" disabled={submitting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        {submitting ? 'Đang Xử Lý...' : 'Xác Nhận Đơn Hàng'}
                      </motion.button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="tet-info mt-5">
                <h5>🧧 Lưu ý khi mua sắm Tết:</h5>
                <ul>
                  <li>Vui lòng nhập chính xác **tên nhân vật** trong game để nhận đồ.</li>
                  <li>Nếu thanh toán qua QR, hệ thống sẽ tự động điền nội dung chuyển khoản.</li>
                  <li>Sau khi chuyển khoản, hãy nhấn **"Đã Thanh Toán"** để Admin kiểm tra.</li>
                  <li>Vật phẩm sẽ được giao tự động sau khi thanh toán được xác nhận.</li>
                  <li>Mọi thắc mắc vui lòng liên hệ Admin qua Discord hoặc mục Liên Hệ.</li>
                </ul>
              </div>
            </div>

            <div className="col-lg-3">
              <div className="tet-glass p-4 sticky-top" style={{ top: '100px', overflow: 'visible' }}>
                <h4 className="tet-section-title mb-3" style={{ color: 'var(--tet-gold-dark)' }}>
                  <BiStar /> Top Nạp
                </h4>

                <div className="d-flex flex-column gap-2 mb-4 bg-white p-2 rounded shadow-sm">
                  <TetDatePicker 
                    label="Từ ngày"
                    value={dateRange.start}
                    onChange={(val) => setDateRange({ ...dateRange, start: val })}
                  />
                  <TetDatePicker 
                    label="Đến ngày"
                    value={dateRange.end}
                    onChange={(val) => setDateRange({ ...dateRange, end: val })}
                  />
                </div>

                <div className="list-unstyled d-flex flex-column gap-3">
                  {loadingTop ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-danger spinner-border-sm" role="status"></div>
                      <div className="mt-2 text-muted small">Đang cập nhật...</div>
                    </div>
                  ) : topDonators.map((user, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className={`rank-item d-flex align-items-center p-2 rounded position-relative ${user.rank === 1 ? 'top-1' : user.rank === 2 ? 'top-2' : user.rank === 3 ? 'top-3' : user.rank === 4 ? 'top-4' : user.rank === 5 ? 'top-5' : ''}`}
                    >
                      <div className="rank-badge">{user.rank}</div>
                      <div className="player-avatar me-3">
                        <img 
                          src={`https://mc-heads.net/avatar/${user.name}/40`} 
                          alt={user.name} 
                          onError={(e) => { e.target.src = 'https://mc-heads.net/avatar/Steve/40'; }}
                        />
                      </div>
                      <div className="player-info flex-grow-1 overflow-hidden">
                        <div className="player-name text-truncate">{user.name}</div>
                        <div className="recharge-amount">{user.total.toLocaleString('vi-VN')} VNĐ</div>
                      </div>
                      {user.rank < 4 && <div className="medal-icon">{user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉'}</div>}
                    </motion.div>
                  ))}
                  {!loadingTop && topDonators.length === 0 && <div className="text-center py-4 text-muted small glass-light rounded">Chưa có dữ liệu cho khoảng thời gian này</div>}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Shop;
