import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BiPlus, BiEdit, BiTrash, BiCheck, BiX } from 'react-icons/bi';
import { supabase } from '../supabaseClient';

const ShopCategoriesManagement = () => {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    display_order: 0,
    active: true
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_deleted', false)
        .order('display_order', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      alert('Lỗi khi tải danh mục: ' + error.message);
    }
  };

  const handleAddNew = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      icon: '',
      display_order: categories.length,
      active: true
    });
    setShowModal(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      display_order: category.display_order || 0,
      active: category.active !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_deleted: true })
        .eq('id', id);
      if (error) throw error;
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Lỗi khi xóa danh mục: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(formData)
          .eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([formData]);
        if (error) throw error;
      }
      setShowModal(false);
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Lỗi khi lưu danh mục: ' + error.message);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="tet-section-title" style={{ margin: 0 }}>Quản Lý Danh Mục</h1>
        <motion.button
          className="tet-button d-flex align-items-center"
          onClick={handleAddNew}
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)' }}
          whileTap={{ scale: 0.95 }}
        >
          <BiPlus className="me-2" size={20} />
          Thêm danh mục
        </motion.button>
      </div>

      <div className="admin-table">
        <table className="table">
          <thead>
            <tr>
              <th>Icon</th>
              <th>Tên</th>
              <th>Mô Tả</th>
              <th>Thứ Tự</th>
              <th>Trạng Thái</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(category => (
              <tr key={category.id}>
                <td>{category.icon || '📦'}</td>
                <td>{category.name}</td>
                <td>{category.description || '-'}</td>
                <td>{category.display_order}</td>
                <td>
                  <span className={`badge ${category.active ? 'bg-success' : 'bg-danger'}`}>
                    {category.active ? 'Hoạt động' : 'Tắt'}
                  </span>
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="tet-button-save btn-sm"
                      onClick={() => handleEdit(category)}
                      title="Sửa danh mục"
                    >
                      <BiEdit size={18} /> Sửa
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="tet-button-danger btn-sm"
                      onClick={() => handleDelete(category.id)}
                      title="Xóa danh mục"
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
          <motion.div className="tet-glass p-4 position-relative" style={{ maxWidth: '600px', width: '90%' }} initial={{ scale: 0.8 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()}>
            <button
              className="tet-close-btn"
              onClick={() => setShowModal(false)}
              title="Đóng"
              style={{ top: '15px', right: '15px' }}
            >
              ✕
            </button>
            <h3 className="tet-section-title mb-4">🧧 {editingCategory ? 'Sửa' : 'Thêm'} Danh Mục</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="tet-label">Tên Danh Mục *</label>
                <input type="text" className="tet-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="mb-3">
                <label className="tet-label">Mô Tả</label>
                <textarea className="tet-input" rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="tet-label">Icon (Emoji)</label>
                <input type="text" className="tet-input" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} placeholder="📦" />
              </div>
              <div className="mb-3">
                <label className="tet-label">Thứ Tự Hiển Thị</label>
                <input type="number" className="tet-input" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="mb-3">
                <label className="tet-label">
                  <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} className="me-2" />
                  Hoạt động
                </label>
              </div>
              <div className="d-flex gap-2">
                <motion.button type="submit" className="tet-button-save" whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(40, 167, 69, 0.4)' }} whileTap={{ scale: 0.95 }}>
                  <BiCheck className="me-2" size={20} />
                  Lưu danh mục
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

export default ShopCategoriesManagement;

