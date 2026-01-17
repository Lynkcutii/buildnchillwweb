import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useData } from '../context/DataContext';
import { generateContactCode, generateOrderCode } from '../utils/helpers';
import RichTextEditor from '../components/RichTextEditor';
import TetEffect from '../components/TetEffect';
import ShopCategoriesManagement from '../components/ShopCategoriesManagement';
import ShopProductsManagement from '../components/ShopProductsManagement';
import ShopOrdersManagement from '../components/ShopOrdersManagement';
import '../styles/tet-theme.css';
import {
  BiBarChart,
  BiNews,
  BiServer,
  BiCog,
  BiPlus,
  BiEdit,
  BiTrash,
  BiLogOutCircle,
  BiCheckCircle,
  BiXCircle,
  BiEnvelope,
  BiCheck,
  BiImage,
  BiShoppingBag,
  BiShow,
  BiCalendar
} from 'react-icons/bi';

const Admin = () => {
  const navigate = useNavigate();
  const {
    news,
    serverStatus,
    contacts,
    siteSettings,
    isAuthenticated,
    logout,
    addNews,
    updateNews,
    deleteNews,
    updateServerStatus,
    updateSiteSettings,
    markContactAsRead,
    updateContactStatus,
    deleteContact
  } = useData();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [serverForm, setServerForm] = useState({
    status: 'Online',
    players: '',
    maxPlayers: '500',
    version: '1.20.4'
  });
  const [settingsForm, setSettingsForm] = useState({
    server_ip: '',
    server_version: '',
    contact_email: '',
    contact_phone: '',
    discord_url: '',
    site_title: ''
  });
  const [selectedContact, setSelectedContact] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [topDateRange, setTopDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [stats, setStats] = useState({
    pendingOrders: 0,
    monthlyOrders: 0,
    yearlyOrders: 0,
    totalOrders: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    totalRevenue: 0,
    revenueByDay: [],
    topProducts: [],
    topDonators: [],
    recentOrders: [],
    recentContacts: []
  });

  const loadDashboardStats = async () => {
    try {
      const { data: allOrders, error } = await supabase
        .from('orders')
        .select('id, created_at, price, status, delivered, product, mc_username, products(name)')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: recentContacts, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(5);

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const pending = allOrders.filter(o => o.status === 'paid' && !o.delivered).length;

      let mOrders = 0;
      let yOrders = 0;
      let tOrders = allOrders.length;
      let mRevenue = 0;
      let yRevenue = 0;
      let tRevenue = 0;

      const productCounts = {};
      const userSpending = {};

      const topStartDate = topDateRange.start ? new Date(topDateRange.start) : null;
      if (topStartDate) topStartDate.setHours(0, 0, 0, 0);
      
      const topEndDate = topDateRange.end ? new Date(topDateRange.end) : null;
      if (topEndDate) topEndDate.setHours(23, 59, 59, 999);

      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return {
          date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
          revenue: 0,
          fullDate: d.toISOString().split('T')[0]
        };
      }).reverse();

      allOrders.forEach(order => {
        const orderDate = new Date(order.created_at);
        const isPaid = order.status === 'paid' || order.status === 'delivered' || order.delivered;
        const price = order.price || 0;

        if (isPaid) {
          tRevenue += price;
          const pName = order.product || order.products?.name || 'Ẩn danh';
          productCounts[pName] = (productCounts[pName] || 0) + 1;

          const username = order.mc_username || 'Ẩn danh';
          
          let shouldIncludeInTop = true;
          if (topStartDate && orderDate < topStartDate) {
            shouldIncludeInTop = false;
          }
          if (topEndDate && orderDate > topEndDate) {
            shouldIncludeInTop = false;
          }
          
          if (shouldIncludeInTop) {
            userSpending[username] = (userSpending[username] || 0) + price;
          }
        }

        if (orderDate.getFullYear() === currentYear) {
          yOrders++;
          if (isPaid) yRevenue += price;
          if (orderDate.getMonth() === currentMonth) {
            mOrders++;
            if (isPaid) mRevenue += price;
          }
        }

        const dateStr = orderDate.toISOString().split('T')[0];
        const dayStat = last7Days.find(d => d.fullDate === dateStr);
        if (dayStat && isPaid) {
          dayStat.revenue += price;
        }
      });

      const topProducts = Object.entries(productCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const topDonators = Object.entries(userSpending)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setStats({
        pendingOrders: pending,
        monthlyOrders: mOrders,
        yearlyOrders: yOrders,
        totalOrders: tOrders,
        monthlyRevenue: mRevenue,
        yearlyRevenue: yRevenue,
        totalRevenue: tRevenue,
        revenueByDay: last7Days,
        topProducts,
        topDonators,
        recentOrders: allOrders.slice(0, 5).map(o => ({
          ...o,
          customer_ign: o.mc_username,
          product_name: o.product || o.products?.name || 'Sản phẩm'
        })),
        recentContacts: recentContacts || []
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadDashboardStats();
    setServerForm({
      status: serverStatus?.status || 'Online',
      players: serverStatus?.players || '0',
      maxPlayers: serverStatus?.maxPlayers || '500',
      version: serverStatus?.version || '1.20.4'
    });
    if (siteSettings) {
      setSettingsForm({
        server_ip: siteSettings.server_ip || '',
        server_version: siteSettings.server_version || '',
        contact_email: siteSettings.contact_email || '',
        contact_phone: siteSettings.contact_phone || '',
        discord_url: siteSettings.discord_url || '',
        site_title: siteSettings.site_title || ''
      });
    }
  }, [isAuthenticated, navigate, serverStatus, siteSettings]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardStats();
    }
  }, [topDateRange]);

  const unresolvedContactsCount = contacts.filter(c => c.status !== 'resolved').length;
  const unreadCount = contacts.filter(c => !c.read).length;
  const pendingCount = unresolvedContactsCount;
  const undeliveredOrdersCount = stats.pendingOrders; // stats.pendingOrders đã lọc theo status paid và !delivered ở loadDashboardStats

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleServerChange = (e) => {
    const { name, value, type, checked } = e.target;
    setServerForm({ ...serverForm, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSettingsForm({ ...settingsForm, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh!');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Kích thước ảnh tối đa 10MB!');
        return;
      }
      setImageFile(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return formData.image;

    try {
      setUploading(true);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('news')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        // Nếu lỗi do chưa có bucket, thử dùng bucket khác hoặc báo lỗi
        console.error('Error uploading image to news bucket:', uploadError);
        // Fallback sang contact-images nếu cần, hoặc thông báo
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('news')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Lỗi khi tải ảnh lên: ' + error.message);
      return formData.image;
    } finally {
      setUploading(false);
    }
  };

  const handleSettingsSave = async () => {
    try {
      const success = await updateSiteSettings(settingsForm);
      if (success) alert('Đã cập nhật cài đặt thành công!');
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const handleAddNew = () => {
    setEditingPost(null);
    setImageFile(null);
    setFormData({ title: '', content: '', image: '', date: new Date().toISOString().split('T')[0], description: '' });
    setShowModal(true);
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setImageFile(null);
    setFormData({ title: post.title, content: post.content, image: post.image, date: post.date, description: post.description });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const finalImageUrl = await uploadImage();
      const finalFormData = { ...formData, image: finalImageUrl };

      if (editingPost) {
        const updatedPost = { ...editingPost, ...finalFormData };
        const success = await updateNews(editingPost.id, updatedPost);
        if (success) { setShowModal(false); setEditingPost(null); setImageFile(null); }
      } else {
        const success = await addNews(finalFormData);
        if (success) { setShowModal(false); setEditingPost(null); setImageFile(null); }
      }
    } catch (error) {
      console.error('Error saving news:', error);
    }
  };

  const handleDelete = async (postId) => {
    if (window.confirm('Bạn có chắc muốn xóa bài viết này?')) await deleteNews(postId);
  };

  const handleServerSave = async () => {
    try {
      const success = await updateServerStatus(serverForm);
      if (success) alert('Đã cập nhật trạng thái server thành công!');
    } catch (error) {
      console.error('Error updating server status:', error);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  if (!isAuthenticated) return null;

  const tabs = [
    { id: 'dashboard', label: 'Bảng Điều Khiển', icon: BiBarChart },
    { id: 'categories', label: 'Danh Mục', icon: BiCog },
    { id: 'products', label: 'Sản Phẩm', icon: BiShoppingBag },
    { id: 'orders', label: 'Đơn Hàng', icon: BiCheckCircle },
    { id: 'news', label: 'Tin Tức', icon: BiNews },
    { id: 'contacts', label: 'Liên Hệ', icon: BiEnvelope },
    { id: 'server', label: 'Trạng Thái Server', icon: BiServer },
    { id: 'settings', label: 'Cài Đặt', icon: BiCog }
  ];

  return (
    <div className="shop-tet-container" style={{ minHeight: '100vh' }}>
      <TetEffect />
      <div className="admin-top-nav d-lg-none">
        <div className="admin-top-nav-header">
          <h4 style={{ color: 'var(--tet-gold)', fontWeight: 800, margin: 0, textShadow: '0 0 15px rgba(255, 215, 0, 0.4)', fontSize: '1.2rem' }}>{siteSettings?.site_title || 'BuildnChill'} Admin</h4>
        </div>
        <nav className="admin-top-nav-menu">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            let notificationCount = 0;
            if (tab.id === 'contacts') notificationCount = unresolvedContactsCount;
            if (tab.id === 'orders') notificationCount = undeliveredOrdersCount;
            const hasNotification = notificationCount > 0;

            return (
              <motion.button
                key={tab.id}
                className={`admin-top-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ position: 'relative' }}
              >
                <Icon size={20} />
                <span className="admin-top-nav-label">{tab.label}</span>
                {hasNotification && <span style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: 'var(--tet-gold)', color: 'var(--tet-lucky-red)', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 'bold' }}>{notificationCount}</span>}
              </motion.button>
            );
          })}
        </nav>
        <div className="admin-top-nav-footer">
          <motion.button
            className="tet-button w-100"
            onClick={handleLogout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ fontSize: '0.9rem', padding: '10px' }}
          >
            <BiLogOutCircle className="me-2" /> ĐĂNG XUẤT
          </motion.button>
        </div>
      </div>

      <div className="d-flex d-lg-flex" style={{ minHeight: '100vh' }}>
        <motion.div className="admin-sidebar d-none d-lg-block" style={{ width: '250px', background: 'var(--tet-gradient-1)', borderRight: '2px solid var(--tet-gold)' }}>
          <div className="p-3 mb-4">
            <h4 style={{ color: 'var(--tet-gold)', fontWeight: 800, margin: 0, textShadow: '0 0 15px rgba(255, 215, 0, 0.4)', fontSize: '1.2rem' }}>{siteSettings?.site_title || 'BuildnChill'} Admin</h4>
          </div>
          <nav className="nav flex-column">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              let notificationCount = 0;
              if (tab.id === 'contacts') notificationCount = unresolvedContactsCount;
              if (tab.id === 'orders') notificationCount = undeliveredOrdersCount;
              const hasNotification = notificationCount > 0;

              return (
                <motion.button key={tab.id} className={`nav-link ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)} style={{ position: 'relative', color: activeTab === tab.id ? 'var(--tet-gold)' : 'white', background: activeTab === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', textAlign: 'left', padding: '12px 20px' }}>
                  <Icon size={20} className="me-2" /> {tab.label}
                  {hasNotification && <span style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'var(--tet-gold)', color: 'var(--tet-lucky-red)', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>{notificationCount}</span>}
                </motion.button>
              );
            })}
          </nav>
          <div className="p-3 mt-auto">
            <motion.button className="tet-button w-100" onClick={handleLogout}>
              <BiLogOutCircle className="me-2" /> Đăng Xuất
            </motion.button>
          </div>
        </motion.div>

        <div className="admin-content flex-grow-1 p-4">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h1 className="tet-title" style={{ margin: 0 }}>Bảng Điều Khiển</h1>
                  <motion.button className="tet-button-outline" onClick={loadDashboardStats}><BiServer className="me-2" /> Làm mới</motion.button>
                </div>
                <div className="row g-3 mb-4">
                  <div className="col-12 col-sm-6 col-md-4 col-lg">
                    <div className="admin-card tet-glass p-3 h-100" style={{ borderLeft: '4px solid #ef4444' }}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h3 className="mb-1" style={{ color: '#ef4444' }}>{stats.pendingOrders}</h3>
                          <p className="mb-1" style={{ color: 'var(--tet-lucky-red-dark)', fontWeight: 700, fontSize: '0.9rem' }}>Đơn Chờ Giao</p>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>Đã thanh toán</small>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6 col-md-4 col-lg">
                    <div className="admin-card tet-glass p-3 h-100" style={{ borderLeft: '4px solid var(--tet-lucky-red)' }}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h3 className="mb-1" style={{ color: 'var(--tet-lucky-red-dark)' }}>{stats.monthlyRevenue?.toLocaleString('vi-VN')} VNĐ</h3>
                          <p className="mb-1" style={{ color: 'var(--tet-lucky-red-dark)', fontWeight: 700, fontSize: '0.9rem' }}>Doanh Thu Tháng</p>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>{stats.monthlyOrders} đơn</small>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6 col-md-4 col-lg">
                    <div className="admin-card tet-glass p-3 h-100" style={{ borderLeft: '4px solid var(--tet-gold)' }}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h3 className="mb-1" style={{ color: 'var(--tet-gold-dark)' }}>{stats.yearlyRevenue?.toLocaleString('vi-VN')} VNĐ</h3>
                          <p className="mb-1" style={{ color: 'var(--tet-lucky-red-dark)', fontWeight: 700, fontSize: '0.9rem' }}>Doanh Thu Năm</p>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>{stats.yearlyOrders} đơn</small>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6 col-md-4 col-lg">
                    <div className="admin-card tet-glass p-3 h-100" style={{ borderLeft: '4px solid #8b5cf6' }}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h3 className="mb-1" style={{ color: '#8b5cf6' }}>{stats.totalRevenue?.toLocaleString('vi-VN')} VNĐ</h3>
                          <p className="mb-1" style={{ color: 'var(--tet-lucky-red-dark)', fontWeight: 700, fontSize: '0.9rem' }}>Tổng Doanh Thu</p>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>Tất cả thời gian</small>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6 col-md-4 col-lg">
                    <div className="admin-card tet-glass p-3 h-100" style={{ borderLeft: '4px solid #f59e0b' }}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h3 className="mb-1" style={{ color: 'var(--tet-gold-dark)' }}>{serverStatus?.players || 0}</h3>
                          <p className="mb-1" style={{ color: 'var(--tet-lucky-red-dark)', fontWeight: 700, fontSize: '0.9rem' }}>Online</p>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>Người chơi</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row g-4 mb-5">
                  <div className="col-12 col-lg-8">
                    <div className="admin-card tet-glass p-4 h-100">
                      <h5 className="mb-4" style={{ color: 'var(--tet-lucky-red-dark)', fontWeight: 700 }}>Doanh Thu 7 Ngày Gần Nhất</h5>
                      <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 10px 40px 10px', borderBottom: '1px solid rgba(0,0,0,0.1)', position: 'relative' }}>
                        {stats.revenueByDay.map((day, index) => {
                          const maxRevenue = Math.max(...stats.revenueByDay.map(d => d.revenue), 100000);
                          const height = (day.revenue / maxRevenue) * 220;
                          return (
                            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '12%' }}>
                              {day.revenue > 0 && <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--tet-lucky-red)', marginBottom: '5px' }}>{(day.revenue / 1000).toFixed(0)}k</span>}
                              <motion.div initial={{ height: 0 }} animate={{ height: `${height}px` }} style={{ width: '100%', background: 'var(--tet-gradient-1)', borderRadius: '4px 4px 0 0', position: 'relative' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '30%', background: 'linear-gradient(to bottom, rgba(255,215,0,0.3), transparent)', borderRadius: '4px 4px 0 0' }}></div>
                              </motion.div>
                              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--tet-lucky-red-dark)', marginTop: '8px' }}>{day.date}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-lg-4">
                    <div className="admin-card tet-glass p-4 mb-4">
                      <h5 className="mb-4" style={{ color: 'var(--tet-lucky-red-dark)', fontWeight: 700 }}>Top Nạp</h5>
                      
                      <div className="d-flex flex-column gap-2 mb-4">
                        <div>
                          <label className="d-block mb-1 small fw-bold text-muted">Từ ngày</label>
                          <div className="position-relative">
                            <input 
                              type="date" 
                              className="tet-input w-100 pe-5 py-1"
                              value={topDateRange.start}
                              onChange={(e) => setTopDateRange({ ...topDateRange, start: e.target.value })}
                              style={{ fontSize: '0.85rem' }}
                            />
                            <BiCalendar className="position-absolute top-50 end-0 translate-middle-y me-2 text-muted" style={{ pointerEvents: 'none' }} />
                          </div>
                        </div>
                        <div>
                          <label className="d-block mb-1 small fw-bold text-muted">Đến ngày</label>
                          <div className="position-relative">
                            <input 
                              type="date" 
                              className="tet-input w-100 pe-5 py-1"
                              value={topDateRange.end}
                              onChange={(e) => setTopDateRange({ ...topDateRange, end: e.target.value })}
                              style={{ fontSize: '0.85rem' }}
                            />
                            <BiCalendar className="position-absolute top-50 end-0 translate-middle-y me-2 text-muted" style={{ pointerEvents: 'none' }} />
                          </div>
                        </div>
                      </div>

                      <div className="list-unstyled">
                        {stats.topDonators.map((user, i) => (
                          <div key={i} className="mb-2 d-flex justify-content-between align-items-center p-2 rounded" style={{ background: 'rgba(255, 215, 0, 0.05)', borderLeft: '3px solid var(--tet-gold)' }}>
                            <span style={{ fontSize: '0.9rem', color: '#4a0404', fontWeight: 600 }}>{i + 1}. {user.name}</span>
                            <span className="badge rounded-pill" style={{ background: 'var(--tet-lucky-red)', color: 'white' }}>{user.total.toLocaleString('vi-VN')}đ</span>
                          </div>
                        ))}
                        {stats.topDonators.length === 0 && <div className="text-center py-2 text-muted small">Chưa có dữ liệu</div>}
                      </div>
                    </div>

                    <div className="admin-card tet-glass p-4 mb-4">
                      <h5 className="mb-4" style={{ color: 'var(--tet-lucky-red-dark)', fontWeight: 700 }}>Sản phẩm bán chạy</h5>
                      <div className="list-unstyled">
                        {stats.topProducts.map((p, i) => (
                          <div key={i} className="mb-2 d-flex justify-content-between align-items-center p-2 rounded" style={{ background: 'rgba(215, 0, 24, 0.05)', borderLeft: '3px solid var(--tet-lucky-red)' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--tet-lucky-red-dark)', fontWeight: 600 }}>{i + 1}. {p.name}</span>
                            <span className="badge rounded-pill" style={{ background: 'var(--tet-gradient-2)', color: 'white' }}>{p.count} đơn</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="admin-card tet-glass p-4">
                      <h5 className="mb-4" style={{ color: 'var(--tet-lucky-red-dark)', fontWeight: 700 }}>Tổng Quan Khác</h5>
                      <div className="d-flex flex-column gap-3">
                        <div className="d-flex justify-content-between align-items-center p-2 rounded border-bottom">
                          <span style={{ fontSize: '0.9rem', color: '#1a1a1a', fontWeight: 600 }}>Bài viết tin tức</span>
                          <span className="badge bg-primary rounded-pill px-3">{news.length}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center p-2 rounded border-bottom">
                          <span style={{ fontSize: '0.9rem', color: '#1a1a1a', fontWeight: 600 }}>Liên hệ mới</span>
                          <span className="badge bg-danger rounded-pill px-3">{unreadCount}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center p-2 rounded border-bottom">
                          <span style={{ fontSize: '0.9rem', color: '#1a1a1a', fontWeight: 600 }}>Liên hệ chờ xử lý</span>
                          <span className="badge bg-warning text-dark rounded-pill px-3">{pendingCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row g-4">
                  <div className="col-12 col-xl-6">
                    <div className="admin-card tet-glass p-4 h-100">
                      <h5 className="mb-4" style={{ color: 'var(--tet-lucky-red-dark)', fontWeight: 700 }}>Đơn Hàng Gần Đây</h5>
                      <div className="table-responsive">
                        <table className="table table-sm align-middle">
                          <thead>
                            <tr>
                              <th>Mã</th>
                              <th>IGN</th>
                              <th>Sản phẩm</th>
                              <th>Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.recentOrders.map((order, i) => (
                              <tr key={i}>
                                <td className="fw-bold" style={{ color: 'var(--tet-lucky-red-dark)', fontSize: '0.75rem' }}>{generateOrderCode(order.id)}</td>
                                <td className="fw-bold" style={{ fontSize: '0.85rem' }}>{order.customer_ign}</td>
                                <td style={{ fontSize: '0.85rem' }}>{order.product_name}</td>
                                <td>
                                  <span className={`badge ${order.delivered || order.status === 'delivered' ? 'bg-success' : order.status === 'paid' ? 'bg-info' : 'bg-warning text-dark'}`} style={{ fontSize: '0.7rem' }}>
                                    {order.delivered || order.status === 'delivered' ? 'Đã Giao' : order.status === 'paid' ? 'Đã TT' : 'Chờ'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <button className="tet-button-outline btn-sm mt-2 w-100" onClick={() => setActiveTab('orders')}>Xem tất cả đơn hàng →</button>
                    </div>
                  </div>
                  <div className="col-12 col-xl-6">
                    <div className="admin-card tet-glass p-4 h-100">
                      <h5 className="mb-4" style={{ color: 'var(--tet-lucky-red-dark)', fontWeight: 700 }}>Tin Nhắn Mới</h5>
                      <div className="list-group list-group-flush">
                        {stats.recentContacts.map((contact, i) => (
                          <div key={i} className="list-group-item border-0 px-0 mb-2" style={{ background: 'transparent' }}>
                            <div className="d-flex w-100 justify-content-between">
                              <h6 className="mb-1" style={{ color: 'var(--tet-lucky-red-dark)' }}>{generateContactCode(contact.id)} - {contact.ign}</h6>
                              <small className="text-muted">{new Date(contact.created_at).toLocaleDateString('vi-VN')}</small>
                            </div>
                            <p className="mb-1 text-truncate" style={{ fontSize: '0.85rem' }}>{contact.subject || contact.message}</p>
                          </div>
                        ))}
                      </div>
                      <button className="tet-button-outline btn-sm mt-2 w-100" onClick={() => setActiveTab('contacts')}>Xem tất cả tin nhắn →</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'news' && (
              <motion.div key="news" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h1 className="tet-section-title">Quản Lý Tin Tức</h1>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    className="tet-button d-flex align-items-center"
                    onClick={handleAddNew}
                  >
                    <BiPlus className="me-2" size={20} /> Thêm bài viết
                  </motion.button>
                </div>
                <div className="admin-table tet-glass">
                  <table className="table">
                    <thead><tr><th style={{ color: 'var(--tet-lucky-red-dark)' }}>Tiêu Đề</th><th style={{ color: 'var(--tet-lucky-red-dark)' }}>Ngày</th><th style={{ color: 'var(--tet-lucky-red-dark)' }}>Thao Tác</th></tr></thead>
                    <tbody>{news.map((post) => (
                      <tr key={post.id}>
                        <td style={{ color: '#0a0a0a' }}>{post.title}</td>
                        <td style={{ color: '#1a1a1a' }}>{new Date(post.date).toLocaleDateString('vi-VN')}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="tet-button-save btn-sm"
                              onClick={() => handleEdit(post)}
                              title="Sửa bài viết"
                            >
                              <BiEdit size={18} /> Sửa
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="tet-button-danger btn-sm"
                              onClick={() => handleDelete(post.id)}
                              title="Xóa bài viết"
                            >
                              <BiTrash size={18} /> Xóa
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'categories' && <motion.div key="categories" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}><ShopCategoriesManagement /></motion.div>}
            {activeTab === 'products' && <motion.div key="products" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}><ShopProductsManagement /></motion.div>}
            {activeTab === 'orders' && <motion.div key="orders" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}><ShopOrdersManagement /></motion.div>}

            {activeTab === 'contacts' && (
              <motion.div key="contacts" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="d-flex justify-content-between align-items-end mb-4">
                  <h1 className="tet-section-title m-0">❄️ Tin Nhắn Liên Hệ</h1>
                  <div className="text-end fw-bold" style={{ color: 'var(--tet-lucky-red-dark)', fontSize: '0.9rem' }}>
                    Tổng: {contacts.length} | Chưa giải quyết: {unresolvedContactsCount}
                  </div>
                </div>

                <div className="admin-table tet-glass" style={{ overflowX: 'auto', border: '2px solid var(--tet-gold)' }}>
                  <table className="table table-hover align-middle m-0">
                    <thead style={{ background: 'rgba(215, 0, 24, 0.05)' }}>
                      <tr>
                        <th style={{ color: 'var(--tet-lucky-red-dark)', fontWeight: '800', borderBottom: '2px solid var(--tet-gold)' }}>MÃ</th>
                        <th style={{ color: 'var(--tet-lucky-red-dark)', fontWeight: '800', borderBottom: '2px solid var(--tet-gold)' }}>TÊN GAME</th>
                        <th style={{ color: 'var(--tet-lucky-red-dark)', fontWeight: '800', borderBottom: '2px solid var(--tet-gold)' }}>EMAIL</th>
                        <th style={{ color: 'var(--tet-lucky-red-dark)', fontWeight: '800', borderBottom: '2px solid var(--tet-gold)' }}>DANH MỤC</th>
                        <th style={{ color: 'var(--tet-lucky-red-dark)', fontWeight: '800', borderBottom: '2px solid var(--tet-gold)' }} className="text-center">ẢNH</th>
                        <th style={{ color: 'var(--tet-lucky-red-dark)', fontWeight: '800', borderBottom: '2px solid var(--tet-gold)' }}>NGÀY</th>
                        <th style={{ color: 'var(--tet-lucky-red-dark)', fontWeight: '800', borderBottom: '2px solid var(--tet-gold)' }}>TRẠNG THÁI</th>
                        <th style={{ color: 'var(--tet-lucky-red-dark)', fontWeight: '800', borderBottom: '2px solid var(--tet-gold)' }}>THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map(c => (
                        <tr key={c.id} style={{ borderBottom: '1px solid rgba(255, 215, 0, 0.2)' }}>
                          <td className="fw-bold" style={{ color: 'var(--tet-lucky-red-dark)', fontSize: '0.8rem' }}>{generateContactCode(c.id)}</td>
                          <td className="fw-bold" style={{ color: '#000' }}>{c.ign}</td>
                          <td><a href={`mailto:${c.email}`} style={{ color: 'var(--tet-lucky-red-dark)', textDecoration: 'none', borderBottom: '1px solid var(--tet-lucky-red)' }}>{c.email}</a></td>
                          <td>
                            <span className="badge" style={{ background: 'var(--tet-gradient-1)', color: '#fff', fontWeight: '600' }}>
                              {c.category === 'report' ? 'Báo Cáo' :
                                c.category === 'bug' ? 'Báo Lỗi' :
                                  c.category === 'help' ? 'Trợ Giúp' :
                                    c.category === 'suggestion' ? 'Đề Xuất' : 'Khác'}
                            </span>
                          </td>
                          <td className="text-center">
                            {c.image_url ? <BiImage size={24} style={{ color: 'var(--tet-gold-dark)' }} /> : <span style={{ color: '#ccc' }}>-</span>}
                          </td>
                          <td style={{ fontSize: '0.85rem', color: '#333' }}>{new Date(c.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {new Date(c.created_at).toLocaleDateString('vi-VN')}</td>
                          <td>
                            <select
                              className="form-select form-select-sm fw-bold"
                              style={{
                                width: '140px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                backgroundColor: c.status === 'resolved' ? '#dcfce7' : c.status === 'processing' ? '#fef9c3' : '#fee2e2',
                                color: c.status === 'resolved' ? '#166534' : c.status === 'processing' ? '#854d0e' : '#b91c1c',
                                border: '1px solid var(--tet-gold)'
                              }}
                              value={c.status || 'pending'}
                              onChange={(e) => updateContactStatus(c.id, e.target.value)}
                            >
                              <option value="pending" style={{ background: '#fff', color: '#b91c1c' }}>🔴 Đã Nhận</option>
                              <option value="processing" style={{ background: '#fff', color: '#854d0e' }}>🟡 Đang Kiểm Tra</option>
                              <option value="resolved" style={{ background: '#fff', color: '#166534' }}>🟢 Đã Giải Quyết</option>
                            </select>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="tet-button-save btn-sm"
                                onClick={() => { setSelectedContact(c); setShowContactModal(true); if (!c.read) markContactAsRead(c.id); }}
                                style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                              >
                                <BiShow size={16} /> XEM
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="tet-button-danger btn-sm"
                                onClick={() => { if (window.confirm('Xóa tin nhắn này?')) deleteContact(c.id); }}
                                style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                              >
                                <BiTrash size={16} /> XÓA
                              </motion.button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {contacts.length === 0 && (
                        <tr>
                          <td colSpan="8" className="text-center py-4 text-muted">Không có tin nhắn nào</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'server' && (
              <motion.div key="server" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h1 className="tet-section-title mb-4">Trạng Thái Server</h1>
                <div className="admin-card tet-glass p-4">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="tet-label">Trạng Thái</label>
                      <select className="tet-input w-100" name="status" value={serverForm.status} onChange={handleServerChange}>
                        <option value="Online">Online</option>
                        <option value="Offline">Offline</option>
                        <option value="Maintenance">Bảo Trì</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="tet-label">Phiên Bản</label>
                      <input type="text" className="tet-input w-100" name="version" value={serverForm.version} onChange={handleServerChange} placeholder="vd: 1.20.4" />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="tet-label">Số Người Chơi Hiện Tại</label>
                      <input type="number" className="tet-input w-100" name="players" value={serverForm.players} onChange={handleServerChange} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="tet-label">Số Người Chơi Tối Đa</label>
                      <input type="number" className="tet-input w-100" name="maxPlayers" value={serverForm.maxPlayers} onChange={handleServerChange} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <button className="tet-button-save" onClick={handleServerSave}><BiCheck size={20} /> Lưu Cấu Hình</button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h1 className="tet-section-title mb-4">Cài Đặt Hệ Thống</h1>
                <div className="admin-card tet-glass p-4">
                  <div className="row">
                    <div className="col-md-12 mb-3">
                      <label className="tet-label">Tiêu Đề Trang Web</label>
                      <input type="text" className="tet-input w-100" name="site_title" value={settingsForm.site_title} onChange={handleSettingsChange} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="tet-label">Địa Chỉ IP Server</label>
                      <input type="text" className="tet-input w-100" name="server_ip" value={settingsForm.server_ip} onChange={handleSettingsChange} placeholder="vd: mc.example.com" />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="tet-label">Phiên Bản Server Hiển Thị</label>
                      <input type="text" className="tet-input w-100" name="server_version" value={settingsForm.server_version} onChange={handleSettingsChange} placeholder="vd: 1.16 - 1.20.4" />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="tet-label">Email Liên Hệ</label>
                      <input type="email" className="tet-input w-100" name="contact_email" value={settingsForm.contact_email} onChange={handleSettingsChange} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="tet-label">Số Điện Thoại</label>
                      <input type="text" className="tet-input w-100" name="contact_phone" value={settingsForm.contact_phone} onChange={handleSettingsChange} />
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="tet-label">Link Discord</label>
                      <input type="text" className="tet-input w-100" name="discord_url" value={settingsForm.discord_url} onChange={handleSettingsChange} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <button className="tet-button-save" onClick={handleSettingsSave}><BiCheck size={20} /> Lưu Cài Đặt</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content tet-glass position-relative">
              <button
                className="tet-close-btn"
                onClick={() => setShowModal(false)}
                title="Đóng"
                style={{ top: '10px', right: '10px' }}
              >
                ✕
              </button>
              <div className="modal-header border-0"><h5 className="tet-section-title m-0">{editingPost ? '🧧 Sửa Bài Viết' : '🧧 Thêm Bài Viết'}</h5></div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="tet-label">Tiêu đề bài viết</label>
                  <input type="text" className="tet-input w-100" name="title" value={formData.title} onChange={handleInputChange} placeholder="Nhập tiêu đề..." />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="tet-label">Ảnh bìa</label>
                    <div className="d-flex gap-2 align-items-center mb-2">
                      {formData.image && !imageFile && (
                        <img src={formData.image} alt="Preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                      )}
                      {imageFile && (
                        <img src={URL.createObjectURL(imageFile)} alt="Preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '2px solid var(--tet-gold)' }} />
                      )}
                      <input 
                        type="file" 
                        className="tet-input flex-grow-1" 
                        accept="image/*" 
                        onChange={handleImageChange}
                      />
                    </div>
                    <small className="text-muted d-block mb-2">Tải ảnh lên (Tối đa 10MB)</small>
                    <input type="text" className="tet-input w-100" name="image" value={formData.image} onChange={handleInputChange} placeholder="Hoặc dán link ảnh..." />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="tet-label">Ngày đăng</label>
                    <input type="date" className="tet-input w-100" name="date" value={formData.date} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="tet-label">Mô tả ngắn</label>
                  <textarea className="tet-input w-100" name="description" value={formData.description} onChange={handleInputChange} placeholder="Mô tả tóm tắt bài viết..." rows="2" />
                </div>
                <div className="mb-3">
                  <label className="tet-label">Nội dung chi tiết</label>
                  <RichTextEditor value={formData.content} onChange={(content) => setFormData({ ...formData, content })} />
                </div>
              </div>
              <div className="modal-footer border-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="tet-button-outline"
                  onClick={() => setShowModal(false)}
                >
                  <BiXCircle size={20} /> Hủy bỏ
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(215, 0, 24, 0.4)' }}
                  whileTap={{ scale: 0.95 }}
                  className="tet-button-save"
                  onClick={handleSave}
                  disabled={uploading}
                >
                  <BiCheck size={20} /> {uploading ? 'Đang tải ảnh...' : 'Lưu bài viết'}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showContactModal && selectedContact && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10000 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content tet-glass p-0 overflow-hidden" style={{ border: '2px solid var(--tet-gold)', borderRadius: '15px' }}>
              <div className="p-4 bg-white position-relative">
                <button
                  className="tet-close-btn"
                  onClick={() => setShowContactModal(false)}
                  title="Đóng"
                  style={{ top: '15px', right: '15px' }}
                >
                  ✕
                </button>

                <h4 className="fw-bold mb-4" style={{ color: 'var(--tet-lucky-red-dark)' }}>Chi Tiết Liên Hệ</h4>

                <div className="row mb-3">
                  <div className="col-md-6 mb-3">
                    <div className="fw-bold mb-1" style={{ color: 'var(--tet-lucky-red-dark)' }}>Tên Game:</div>
                    <div style={{ color: '#000' }}>{selectedContact.ign}</div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="fw-bold mb-1" style={{ color: 'var(--tet-lucky-red-dark)' }}>Email:</div>
                    <div><a href={`mailto:${selectedContact.email}`} style={{ color: 'var(--tet-lucky-red-dark)', textDecoration: 'none' }}>{selectedContact.email}</a></div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="fw-bold mb-1" style={{ color: 'var(--tet-lucky-red-dark)' }}>Số Điện Thoại:</div>
                    <div style={{ color: '#000' }}>{selectedContact.phone || 'Không có'}</div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="fw-bold mb-1" style={{ color: 'var(--tet-lucky-red-dark)' }}>Danh Mục:</div>
                    <span className="badge" style={{ background: 'var(--tet-gradient-1)', color: '#fff', padding: '6px 15px', borderRadius: '6px' }}>
                      {selectedContact.category === 'report' ? 'Báo Cáo' :
                        selectedContact.category === 'bug' ? 'Báo Lỗi' :
                          selectedContact.category === 'help' ? 'Trợ Giúp' :
                            selectedContact.category === 'suggestion' ? 'Đề Xuất' : 'Khác'}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="fw-bold mb-1" style={{ color: 'var(--tet-lucky-red-dark)' }}>Nội Dung:</div>
                  <div style={{ color: '#000', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {selectedContact.message}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="fw-bold mb-1" style={{ color: 'var(--tet-lucky-red-dark)' }}>Ảnh Đính Kèm:</div>
                  <div className="mt-2 p-2 rounded" style={{ border: '2px solid var(--tet-gold)', background: 'rgba(255, 215, 0, 0.05)' }}>
                    {selectedContact.image_url ? (
                      <div className="text-center">
                        <img
                          src={selectedContact.image_url}
                          alt="Attached"
                          className="img-fluid rounded shadow-sm mb-2"
                          style={{ maxHeight: '400px', border: '1px solid var(--tet-gold)' }}
                        />
                        <div>
                          <a href={selectedContact.image_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--tet-lucky-red-dark)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                            Mở ảnh trong tab mới
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted">Không có ảnh đính kèm</div>
                    )}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="fw-bold mb-1" style={{ color: 'var(--tet-lucky-red-dark)' }}>Ngày Gửi:</div>
                  <div style={{ color: '#000' }}>
                    {new Date(selectedContact.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} {new Date(selectedContact.created_at).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
