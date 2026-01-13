import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { BiShield, BiUser, BiLock } from 'react-icons/bi';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useData();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(username, password);
    if (success) {
      navigate('/admin');
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không đúng');
    }
  };

  return (
    <div className="shop-tet-container d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="container">
        <div className="row">
          <div className="col-md-5 mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="card tet-glass p-4 shadow-lg" style={{ border: '3px solid var(--tet-gold)' }}>
                <div className="text-center mb-4">
                  <motion.div
                    animate={{
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="mb-3"
                  >
                    <BiShield size={70} style={{ color: 'var(--tet-lucky-red)', filter: 'drop-shadow(0 0 10px rgba(215, 0, 24, 0.3))' }} />
                  </motion.div>
                  <h2 className="tet-title mb-2" style={{ fontSize: '2rem' }}>
                    Đăng Nhập Quản Trị
                  </h2>
                  <p className="tet-subtitle mb-0">Hệ Thống Quản Lý Bính Ngọ 2026</p>
                </div>

                {error && (
                  <motion.div
                    className="alert tet-message error mb-4"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="tet-label">
                      <BiUser /> Tên Đăng Nhập
                    </label>
                    <div className="position-relative">
                      <input
                        type="text"
                        className="tet-input w-100"
                        placeholder="Nhập tên tài khoản..."
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{ paddingLeft: '1rem' }}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="tet-label">
                      <BiLock /> Mật Khẩu
                    </label>
                    <div className="position-relative">
                      <input
                        type="password"
                        className="tet-input w-100"
                        placeholder="Nhập mật khẩu..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ paddingLeft: '1rem' }}
                      />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    className="tet-button-shop w-100"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Vào Hệ Thống 🧧
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
