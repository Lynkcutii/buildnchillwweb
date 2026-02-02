import { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';

const Auth = () => {
  const { login, register } = useData();
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const username = formData.username.trim();
    if (!username || username.includes(' ')) {
      alert("Tên nhân vật không được để trống và không chứa khoảng trắng!");
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        const success = await register(username, formData.password);
        if (success) {
          alert('Đăng ký thành công! Chào mừng ' + username);
          window.location.href = '/shop';
        } else {
          throw new Error('Đăng ký thất bại. Tên nhân vật có thể đã tồn tại.');
        }
      } else {
        const success = await login(username, formData.password);
        if (success) {
          window.location.href = '/shop';
        } else {
          throw new Error('Tên nhân vật hoặc mật khẩu không chính xác!');
        }
      }
    } catch (error) {
      alert("Lỗi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shop-tet-container d-flex align-items-center justify-content-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="tet-glass p-5 w-100" style={{ maxWidth: '450px' }}
      >
        <div className="text-center mb-4">
          <img 
            src={formData.username ? `https://mc-heads.net/avatar/${formData.username}/64` : 'https://mc-heads.net/avatar/Steve/64'} 
            alt="avatar" 
            className="mb-3 rounded shadow-sm"
            style={{ width: '64px', height: '64px', border: '2px solid var(--tet-gold)' }}
          />
          <h2 className="tet-title d-block mb-0">{isRegister ? 'Đăng Ký' : 'Đăng Nhập'}</h2>
        </div>

        <form onSubmit={handleAuth}>
          <div className="mb-3">
            <label className="small fw-bold">Tên nhân vật Minecraft (IGN)</label>
            <input 
              type="text" className="tet-input" required
              placeholder="Nhập tên nhân vật..."
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
            <div className="text-muted" style={{ fontSize: '0.65rem' }}>* Tên này dùng để nhận vật phẩm trong game</div>
          </div>
          
          <div className="mb-4">
            <label className="small fw-bold">Mật khẩu</label>
            <input 
              type="password" className="tet-input" required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button className="tet-button-shop w-100 py-3" disabled={loading}>
            {loading ? (
              <span className="spinner-border spinner-border-sm me-2"></span>
            ) : null}
            {isRegister ? 'ĐĂNG KÝ NGAY' : 'ĐĂNG NHẬP'}
          </button>
        </form>

        <div className="text-center mt-4">
          <button className="btn btn-link text-danger small text-decoration-none" onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
