import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { BiSearch, BiEdit, BiTrash, BiCheck, BiX, BiUser, BiShieldAlt, BiImage } from 'react-icons/bi';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    username: '',
    role: 'user',
    new_password: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Lỗi khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      username: user.username || '',
      role: user.role || 'user',
      new_password: ''
    });
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    try {
      // 1. Update Profile Info
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: editForm.username,
          role: editForm.role
        })
        .eq('id', editingUser.id);

      if (profileError) throw profileError;
      
      // 2. Update Password if provided
      if (editForm.new_password.trim()) {
        if (editForm.new_password.length < 6) {
          alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
          return;
        }

        const { data: passwordResult, error: passwordError } = await supabase.rpc('admin_force_update_password', {
          p_user_id: editingUser.id,
          p_new_password: editForm.new_password
        });

        if (passwordError) throw passwordError;
        if (!passwordResult.success) throw new Error(passwordResult.message);
      }
      
      alert('Cập nhật thông tin người dùng thành công!');
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Lỗi: ' + error.message);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này? Thao tác này KHÔNG THỂ hoàn tác.')) {
      return;
    }

    try {
      // Note: Delete from profiles is possible, but delete from auth.users needs admin API or a trigger
      // Here we attempt to delete from profiles. If RLS or Foreign Key constraints are set correctly, 
      // this will work if the admin has enough permissions or if there's a trigger.
      // However, usually deleting a user from the web app requires Supabase Admin Auth API.
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      alert('Đã xóa hồ sơ người dùng thành công!');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Lỗi: ' + error.message);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="user-management">
      <div className="d-flex justify-content-between align-items-center mb-4 gap-3">
        <div className="position-relative flex-grow-1">
          <BiSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={20} />
          <input
            type="text"
            className="tet-input ps-5 w-100"
            placeholder="Tìm kiếm theo username, tên hoặc ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="tet-button-outline" onClick={fetchUsers}>Làm mới</button>
      </div>

      <div className="admin-table tet-glass" style={{ overflowX: 'auto', border: '2px solid var(--tet-gold)' }}>
        <table className="table table-hover align-middle m-0">
          <thead style={{ background: 'rgba(215, 0, 24, 0.05)' }}>
            <tr>
              <th className="fw-bold" style={{ color: 'var(--tet-lucky-red-dark)' }}>AVATAR</th>
              <th className="fw-bold" style={{ color: 'var(--tet-lucky-red-dark)' }}>USERNAME</th>
              <th className="fw-bold" style={{ color: 'var(--tet-lucky-red-dark)' }}>HỌ TÊN</th>
              <th className="fw-bold" style={{ color: 'var(--tet-lucky-red-dark)' }}>VAI TRÒ</th>
              <th className="fw-bold" style={{ color: 'var(--tet-lucky-red-dark)' }}>NGÀY TẠO</th>
              <th className="fw-bold text-end" style={{ color: 'var(--tet-lucky-red-dark)' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-4"><div className="spinner-border text-danger"></div></td></tr>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <img 
                      src={user.avatar_url || `https://mc-heads.net/avatar/${user.username}/32`} 
                      alt="avatar" 
                      style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }}
                    />
                  </td>
                  <td className="fw-bold">{user.username}</td>
                  <td>{user.full_name || '-'}</td>
                  <td>
                    <span className={`badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}`}>
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                  <td className="text-end">
                    <div className="d-flex justify-content-end gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleEdit(user)}
                      >
                        <BiEdit />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(user.id)}
                      >
                        <BiTrash />
                      </motion.button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" className="text-center py-4 text-muted">Không tìm thấy người dùng nào</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {editingUser && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10000 }}>
            <div className="modal-dialog modal-dialog-centered">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="modal-content tet-glass border-2"
                style={{ border: '2px solid var(--tet-gold)' }}
              >
                <div className="modal-header border-0">
                  <h5 className="tet-section-title m-0">Sửa thông tin người dùng</h5>
                  <button type="button" className="btn-close" onClick={() => setEditingUser(null)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3 text-center">
                    <img 
                      src={editingUser.avatar_url || `https://mc-heads.net/avatar/${editForm.username}/64`} 
                      alt="avatar" 
                      style={{ width: '64px', height: '64px', borderRadius: '8px', border: '2px solid var(--tet-gold)', marginBottom: '10px' }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="tet-label">Username</label>
                    <input
                      type="text"
                      className="tet-input w-100"
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="tet-label">Vai trò</label>
                    <select
                      className="tet-input w-100"
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    >
                      <option value="user">Người chơi (User)</option>
                      <option value="admin">Quản trị viên (Admin)</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="tet-label">Mật khẩu mới (Để trống nếu không đổi)</label>
                    <input
                      type="password"
                      className="tet-input w-100"
                      value={editForm.new_password}
                      onChange={(e) => setEditForm({ ...editForm, new_password: e.target.value })}
                      placeholder="Nhập mật khẩu mới cho người dùng..."
                    />
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button className="tet-button-outline" onClick={() => setEditingUser(null)}>
                    <BiX className="me-1" /> Hủy
                  </button>
                  <button className="tet-button-save" onClick={handleUpdate}>
                    <BiCheck className="me-1" /> Cập nhật
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
