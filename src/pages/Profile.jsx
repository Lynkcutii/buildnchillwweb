import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { BiWallet, BiHistory, BiUser, BiPlusCircle, BiLogOut, BiX, BiUpload, BiCheckCircle, BiQrScan, BiCreditCard, BiLockAlt } from 'react-icons/bi';
import TetEffect from '../components/TetEffect';
import { useData } from '../context/DataContext';

const Profile = () => {
  const { updatePassword } = useData();
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);
  
  // Recharge form state
  const [rechargeForm, setRechargeForm] = useState({
    amount: '',
    payment_method: 'bank',
    proof_image: null
  });
  const [uploading, setUploading] = useState(false);
  const [rechargeHistory, setRechargeHistory] = useState([]);

  const paymentInfo = {
    bank_account: '0000865746243',
    bank_name: 'MBBank',
    account_name: 'LE DUC TRONG'
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [prof, wal] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('wallets').select('*').eq('user_id', user.id).single()
      ]);

      setProfile(prof.data);
      setWallet(wal.data);

      if (wal.data) {
        const [trans, recharges] = await Promise.all([
          supabase.from('wallet_transactions')
            .select('*')
            .eq('wallet_id', wal.data.id)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase.from('recharges')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5)
        ]);
        setTransactions(trans.data || []);
        setRechargeHistory(recharges.data || []);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setRechargeForm({ ...rechargeForm, proof_image: e.target.files[0] });
    }
  };

  const handleRechargeSubmit = async (e) => {
    e.preventDefault();
    if (!rechargeForm.amount || !rechargeForm.proof_image) {
      alert('Vui lòng nhập số tiền và tải ảnh minh chứng!');
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Upload image
      const fileExt = rechargeForm.proof_image.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('recharges')
        .upload(fileName, rechargeForm.proof_image);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('recharges')
        .getPublicUrl(fileName);

      // 2. Create recharge request
      const { error: insertError } = await supabase
        .from('recharges')
        .insert({
          user_id: user.id,
          amount: parseInt(rechargeForm.amount),
          payment_method: rechargeForm.payment_method,
          proof_image: publicUrl,
          status: 'pending'
        });

      if (insertError) throw insertError;

      alert('Gửi yêu cầu nạp tiền thành công! Vui lòng chờ Admin duyệt.');
      setShowRechargeModal(false);
      setRechargeForm({ amount: '', payment_method: 'bank', proof_image: null });
      fetchUserData();
    } catch (error) {
      alert('Lỗi: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    setUpdatingPassword(true);
    try {
      const success = await updatePassword(passwordForm.newPassword);
      if (success) {
        alert('Cập nhật mật khẩu thành công!');
        setShowPasswordModal(false);
        setPasswordForm({ newPassword: '', confirmPassword: '' });
      } else {
        alert('Cập nhật mật khẩu thất bại. Vui lòng thử lại sau.');
      }
    } catch (error) {
      alert('Lỗi: ' + error.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) return <div className="text-center py-5 mt-5"><div className="spinner-border text-danger"></div></div>;

  return (
    <div className="shop-tet-container">
      <TetEffect />
      <div className="container py-5">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-5 text-center">
          <h1 className="tet-title">Hồ Sơ Của Bạn</h1>
        </motion.div>

        <div className="row g-4">
          <div className="col-lg-4">
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="tet-glass p-4 text-center sticky-top" style={{ top: '100px' }}>
              <div className="mb-3 position-relative d-inline-block">
                <img src={`https://mc-heads.net/avatar/${profile?.username}/100`} alt="avatar" className="rounded shadow-sm" style={{ border: '3px solid var(--tet-gold)' }} />
                <div className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle" style={{ width: '15px', height: '15px' }}></div>
              </div>
              <h4 className="fw-bold mb-1" style={{ color: 'var(--tet-lucky-red-dark)' }}>{profile?.username}</h4>
              <p className="text-muted small mb-4">{profile?.role === 'admin' ? '🛡️ Quản trị viên' : '👤 Người chơi'}</p>
              
              <div className="bg-white p-4 rounded shadow-sm mb-4 border-top border-bottom border-warning border-3">
                <div className="small text-muted mb-1 fw-bold text-uppercase">Số dư ví nội bộ</div>
                <h2 className="text-danger fw-black mb-0">{(wallet?.balance || 0).toLocaleString()} <small style={{ fontSize: '0.5em' }}>VNĐ</small></h2>
              </div>

              <div className="d-grid gap-2">
                <button onClick={() => setShowRechargeModal(true)} className="tet-button-shop py-3"><BiPlusCircle className="me-2" /> Nạp tiền vào ví</button>
                <button onClick={() => setShowPasswordModal(true)} className="tet-button-outline py-2"><BiLockAlt className="me-2" /> Đổi mật khẩu</button>
                <button onClick={handleLogout} className="btn btn-link text-muted btn-sm"><BiLogOut className="me-1" /> Đăng xuất tài khoản</button>
              </div>
            </motion.div>
          </div>

          <div className="col-lg-8">
            <div className="d-flex flex-column gap-4">
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="tet-glass p-4">
                <h5 className="mb-4 d-flex align-items-center fw-bold" style={{ color: 'var(--tet-lucky-red-dark)' }}>
                  <BiHistory className="me-2 text-danger" /> Lịch sử biến động số dư
                </h5>
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th className="small">Thời gian</th>
                        <th className="small">Loại</th>
                        <th className="small text-end">Số tiền</th>
                        <th className="small text-end">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t) => (
                        <tr key={t.id}>
                          <td className="small text-muted">{new Date(t.created_at).toLocaleString('vi-VN')}</td>
                          <td>
                            <span className={`badge ${t.amount > 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} border`}>
                              {t.type === 'recharge' ? 'Nạp tiền' : t.type === 'purchase' ? 'Mua hàng' : t.type === 'admin_adjustment' ? 'Điều chỉnh' : 'Khác'}
                            </span>
                          </td>
                          <td className={`fw-bold text-end ${t.amount > 0 ? 'text-success' : 'text-danger'}`}>
                            {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}
                          </td>
                          <td className="small text-end text-muted">{t.note}</td>
                        </tr>
                      ))}
                      {transactions.length === 0 && <tr><td colSpan="4" className="text-center py-4 text-muted">Chưa có giao dịch nào</td></tr>}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="tet-glass p-4">
                <h5 className="mb-4 d-flex align-items-center fw-bold" style={{ color: 'var(--tet-lucky-red-dark)' }}>
                  <BiCheckCircle className="me-2 text-danger" /> Trạng thái yêu cầu nạp tiền
                </h5>
                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <thead>
                      <tr>
                        <th className="small">Ngày nạp</th>
                        <th className="small text-end">Số tiền</th>
                        <th className="small text-end">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rechargeHistory.map((r) => (
                        <tr key={r.id}>
                          <td className="small text-muted">{new Date(r.created_at).toLocaleDateString('vi-VN')}</td>
                          <td className="small fw-bold text-end text-danger">{r.amount.toLocaleString()} VNĐ</td>
                          <td className="text-end">
                            <span className={`badge ${r.status === 'pending' ? 'bg-warning' : r.status === 'approved' ? 'bg-success' : 'bg-danger'}`}>
                              {r.status === 'pending' ? 'Đang chờ' : r.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {rechargeHistory.length === 0 && <tr><td colSpan="3" className="text-center py-3 text-muted small">Không có yêu cầu nạp tiền gần đây</td></tr>}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Recharge Modal */}
      <AnimatePresence>
        {showRechargeModal && (
          <div className="modal-backdrop-custom d-flex align-items-center justify-content-center p-3" style={{ zIndex: 9999 }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="tet-glass p-4 w-100 shadow-lg border-2" 
              style={{ maxWidth: '600px', backgroundColor: 'white', border: '2px solid var(--tet-gold)' }}
            >
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-black m-0 text-danger">🏮 Nạp Tiền Vào Ví</h4>
                <button onClick={() => setShowRechargeModal(false)} className="btn btn-link text-dark p-0"><BiX size={30} /></button>
              </div>

              <div className="row g-4 mb-4">
                <div className="col-md-5 text-center">
                  <div className="text-center mb-4 p-3 bg-white rounded shadow-sm border border-warning">
                    <img 
                      src={`https://mc-heads.net/avatar/${profile?.username}/100`} 
                      alt="avatar" 
                      className="rounded mb-2 shadow-sm"
                      style={{ border: '2px solid var(--tet-lucky-red)' }}
                    />
                    <div className="fw-black text-danger h5 mb-0">{profile?.username}</div>
                  </div>
                  
                  {rechargeForm.amount && parseInt(rechargeForm.amount) > 0 ? (
                    <div className="p-3 bg-white rounded border border-warning text-center">
                      <div className="small text-muted mb-2 fw-bold d-flex align-items-center justify-content-center gap-2">
                        <BiQrScan /> Mã QR Thanh Toán
                      </div>
                      <img
                        src={`https://img.vietqr.io/image/MB-${paymentInfo.bank_account}-compact2.png?amount=${rechargeForm.amount}&addInfo=NAP ${profile?.username}&accountName=${paymentInfo.account_name}`}
                        alt="VietQR"
                        className="img-fluid rounded shadow-sm"
                        style={{ maxWidth: '200px' }}
                      />
                      <div className="mt-2 small text-muted">Mở App ngân hàng quét mã để tự động điền</div>
                    </div>
                  ) : (
                    <div className="p-4 bg-light rounded border border-dashed text-muted text-center small">
                      <BiQrScan size={40} className="mb-2 d-block mx-auto opacity-50" />
                      Nhập số tiền ở bên phải để tạo mã QR thanh toán nhanh
                    </div>
                  )}
                </div>

                <div className="col-md-7">
                  <div className="p-3 mb-3" style={{ background: 'rgba(215, 0, 24, 0.05)', borderRadius: '8px', border: '1px solid var(--tet-lucky-red)' }}>
                    <div className="small fw-bold text-danger mb-2 d-flex align-items-center gap-2">
                      <BiCreditCard /> Thông tin chuyển khoản:
                    </div>
                    <div className="small mb-1"><strong>Ngân hàng:</strong> {paymentInfo.bank_name}</div>
                    <div className="small mb-1"><strong>Số tài khoản:</strong> {paymentInfo.bank_account}</div>
                    <div className="small mb-1"><strong>Chủ tài khoản:</strong> {paymentInfo.account_name}</div>
                    <div className="small p-2 bg-danger-subtle rounded mt-2 border border-danger">
                      <strong>Nội dung:</strong> NAP {profile?.username}
                    </div>
                  </div>

                  <form onSubmit={handleRechargeSubmit}>
                    <div className="mb-3">
                      <label className="small fw-bold mb-1">Số tiền muốn nạp (VNĐ)</label>
                      <input 
                        type="number" 
                        className="tet-input" 
                        placeholder="Ví dụ: 50000" 
                        value={rechargeForm.amount} 
                        onChange={e => setRechargeForm({...rechargeForm, amount: e.target.value})} 
                        required 
                      />
                    </div>
                    <div className="mb-3">
                      <label className="small fw-bold mb-1">Phương thức</label>
                      <div className="tet-input bg-light d-flex align-items-center gap-2">
                        <BiCreditCard className="text-danger" />
                        Chuyển khoản ngân hàng (VietQR)
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="small fw-bold mb-1">Ảnh minh chứng thanh toán</label>
                      <div 
                        className="border border-dashed rounded p-3 text-center cursor-pointer hover-bg-light" 
                        style={{ borderStyle: 'dashed' }} 
                        onClick={() => document.getElementById('proof-upload').click()}
                      >
                        <BiUpload size={24} className="text-muted mb-1" />
                        <div className="small text-muted overflow-hidden text-truncate px-2">
                          {rechargeForm.proof_image ? rechargeForm.proof_image.name : 'Tải ảnh biên lai lên'}
                        </div>
                        <input type="file" id="proof-upload" className="d-none" accept="image/*" onChange={handleFileChange} />
                      </div>
                    </div>
                    <button type="submit" className="tet-button-shop w-100 py-3" disabled={uploading}>
                      {uploading ? <span className="spinner-border spinner-border-sm me-2"></span> : <BiCheckCircle className="me-1" />}
                      {uploading ? 'Đang gửi...' : 'Xác nhận đã chuyển tiền'}
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="modal-backdrop-custom d-flex align-items-center justify-content-center p-3" style={{ zIndex: 9999 }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="tet-glass p-4 w-100 shadow-lg border-2" 
              style={{ maxWidth: '400px', backgroundColor: 'white', border: '2px solid var(--tet-gold)' }}
            >
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-black m-0 text-danger"><BiLockAlt className="me-2" /> Đổi Mật Khẩu</h4>
                <button onClick={() => setShowPasswordModal(false)} className="btn btn-link text-dark p-0"><BiX size={30} /></button>
              </div>

              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-3">
                  <label className="small fw-bold mb-1">Mật khẩu mới</label>
                  <input 
                    type="password" 
                    className="tet-input" 
                    placeholder="Tối thiểu 6 ký tự" 
                    value={passwordForm.newPassword} 
                    onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} 
                    required 
                  />
                </div>
                <div className="mb-4">
                  <label className="small fw-bold mb-1">Xác nhận mật khẩu</label>
                  <input 
                    type="password" 
                    className="tet-input" 
                    placeholder="Nhập lại mật khẩu mới" 
                    value={passwordForm.confirmPassword} 
                    onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} 
                    required 
                  />
                </div>
                <button type="submit" className="tet-button-shop w-100 py-3" disabled={updatingPassword}>
                  {updatingPassword ? <span className="spinner-border spinner-border-sm me-2"></span> : <BiCheckCircle className="me-1" />}
                  {updatingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
