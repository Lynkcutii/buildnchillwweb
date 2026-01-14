import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BiPlus, BiEdit, BiTrash, BiCheck, BiX } from 'react-icons/bi';
import { supabase } from '../supabaseClient';

const ShopProductsManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    command: '',
    price: 0,
    display_price: '',
    category_id: '',
    display_order: 0,
    active: true
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('is_deleted', false)
        .order('display_order', { ascending: true });
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      alert('Lỗi khi tải sản phẩm: ' + error.message);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_deleted', false)
        .eq('active', true)
        .order('display_order');
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setImageFile(null);
    setFormData({
      name: '',
      description: '',
      image_url: '',
      command: '',
      price: 0,
      display_price: '',
      category_id: categories[0]?.id || '',
      display_order: products.length,
      active: true
    });
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setImageFile(null);
    setFormData({
      name: product.name,
      description: product.description || '',
      image_url: product.image_url || '',
      command: product.command,
      price: product.price || 0,
      display_price: product.display_price || '',
      category_id: product.category_id || '',
      display_order: product.display_order || 0,
      active: product.active !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_deleted: true })
        .eq('id', id);
      if (error) throw error;
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Lỗi khi xóa sản phẩm: ' + error.message);
    }
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
    if (!imageFile) return formData.image_url;

    try {
      setUploading(true);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Lỗi khi tải ảnh lên: ' + error.message);
      return formData.image_url;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const finalImageUrl = await uploadImage();
      const finalFormData = { ...formData, image_url: finalImageUrl };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(finalFormData)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([finalFormData]);
        if (error) throw error;
      }
      setShowModal(false);
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Lỗi khi lưu sản phẩm: ' + error.message);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="tet-section-title" style={{ margin: 0 }}>Quản Lý Sản Phẩm</h1>
        <motion.button
          className="tet-button d-flex align-items-center"
          onClick={handleAddNew}
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)' }}
          whileTap={{ scale: 0.95 }}
        >
          <BiPlus className="me-2" size={20} />
          Thêm sản phẩm mới
        </motion.button>
      </div>

      <div className="admin-table">
        <table className="table">
          <thead>
            <tr>
              <th>Hình Ảnh</th>
              <th>Tên</th>
              <th>Danh Mục</th>
              <th>Giá</th>
              <th>Thứ Tự</th>
              <th>Trạng Thái</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                  ) : (
                    <span>📦</span>
                  )}
                </td>
                <td>{product.name}</td>
                <td>{product.categories?.name || '-'}</td>
                <td>{product.display_price || product.price?.toLocaleString('vi-VN') + ' VNĐ'}</td>
                <td>{product.display_order}</td>
                <td>
                  <span className={`badge ${product.active ? 'bg-success' : 'bg-danger'}`}>
                    {product.active ? 'Hoạt động' : 'Tắt'}
                  </span>
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="tet-button-save btn-sm"
                      onClick={() => handleEdit(product)}
                      title="Sửa sản phẩm"
                    >
                      <BiEdit size={18} /> Sửa
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="tet-button-danger btn-sm"
                      onClick={() => handleDelete(product.id)}
                      title="Xóa sản phẩm"
                    >
                      <BiTrash size={18} /> Xóa
                    </motion.button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999 }} onClick={() => setShowModal(false)}>
          <motion.div className="tet-glass p-4 position-relative" style={{ maxWidth: '700px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} initial={{ scale: 0.8 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()}>
            <button
              className="tet-close-btn"
              onClick={() => setShowModal(false)}
              title="Đóng"
              style={{ top: '15px', right: '15px' }}
            >
              ✕
            </button>
            <h3 className="tet-section-title mb-4">🧧 {editingProduct ? 'Sửa' : 'Thêm'} Sản Phẩm</h3>
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="tet-label">Tên Sản Phẩm *</label>
                  <input type="text" className="tet-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="tet-label">Danh Mục *</label>
                  <select className="tet-select" value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} required>
                    <option value="">Chọn danh mục</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="tet-label">Mô Tả</label>
                <textarea className="tet-input" rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="tet-label">Hình Ảnh Sản Phẩm</label>
                <div className="d-flex gap-3 align-items-center mb-2">
                  {formData.image_url && !imageFile && (
                    <img src={formData.image_url} alt="Preview" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--tet-gold)' }} />
                  )}
                  {imageFile && (
                    <img src={URL.createObjectURL(imageFile)} alt="Preview" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '2px solid var(--tet-lucky-red)' }} />
                  )}
                  <input 
                    type="file" 
                    className="tet-input flex-grow-1" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                  />
                </div>
                <small className="text-muted d-block mb-2">Tải ảnh lên (Tối đa 10MB). Hoặc nhập URL bên dưới.</small>
                <input type="url" className="tet-input" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="tet-label">Command * (dùng {`{username}`} cho tên player)</label>
                  <input type="text" className="tet-input" value={formData.command} onChange={(e) => setFormData({ ...formData, command: e.target.value })} required placeholder="give {username} diamond 100" />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="tet-label">Giá (VNĐ) *</label>
                  <input type="number" className="tet-input" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} required min="0" step="0.01" />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="tet-label">Hiển Thị Giá (tùy chọn)</label>
                  <input type="text" className="tet-input" value={formData.display_price} onChange={(e) => setFormData({ ...formData, display_price: e.target.value })} placeholder="100.000 VNĐ hoặc FREE" />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="tet-label">Thứ Tự Hiển Thị</label>
                  <input type="number" className="tet-input" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="mb-3">
                <label className="tet-label">
                  <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} className="me-2" />
                  Hoạt động
                </label>
              </div>
              <div className="d-flex gap-2">
                <motion.button type="submit" className="tet-button-save" whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(40, 167, 69, 0.4)' }} whileTap={{ scale: 0.95 }} disabled={uploading}>
                  <BiCheck className="me-2" size={20} />
                  {uploading ? 'Đang tải ảnh...' : (editingProduct ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới')}
                </motion.button>
                <motion.button type="button" className="tet-button-outline" onClick={() => setShowModal(false)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <BiX className="me-2" size={20} />
                  Hủy bỏ
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ShopProductsManagement;

