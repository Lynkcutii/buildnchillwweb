import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { BiWallet, BiPlus, BiMinus, BiSearch, BiHistory, BiRefresh } from 'react-icons/bi';

const WalletManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchUsers(true);

    // Realtime subscription cho profiles và wallets
    const profileChannel = supabase.channel('admin_profile_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchUsers(false);
      })
      .subscribe();

    const walletChannel = supabase.channel('admin_wallet_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' }, () => {
        fetchUsers(false);
      })
      .subscribe();

    const handleUpdate = () => {
      fetchUsers(false);
    };

    // Lắng nghe sự thay đổi ví từ context/realtime
    window.addEventListener('wallet_updated', handleUpdate);
    return () => {
      window.removeEventListener('wallet_updated', handleUpdate);
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(walletChannel);
    };
  }, [selectedUser?.id]); // Thêm selectedUser.id vào dependency để cập nhật khi có thay đổi

  const fetchUsers = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      console.log('Fetching users and wallets...');
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          role,
          wallets (
            id,
            balance,
            user_id
          )
        `)
        .order('username');
      
      if (error) {
        console.error('Supabase error in fetchUsers:', error);
        throw error;
      }
      
      // Xử lý dữ liệu để đảm bảo wallets luôn là mảng hoặc lấy balance trực tiếp
      const processedData = data?.map(user => {
        let balance = 0;
        let walletId = null;

        if (Array.isArray(user.wallets)) {
          balance = user.wallets[0]?.balance || 0;
          walletId = user.wallets[0]?.id;
        } else if (user.wallets) {
          balance = user.wallets.balance || 0;
          walletId = user.wallets.id;
        }

        return {
          ...user,
          display_balance: balance,
          wallet_id: walletId
        };
      });

      console.log('Processed data for UI:', processedData);
      setUsers(processedData || []);
      
      // Cập nhật selectedUser nếu nó đang được chọn
      if (selectedUser) {
        const updatedUser = (processedData || []).find(u => u.id === selectedUser.id);
        if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(selectedUser)) {
          setSelectedUser(updatedUser);
          if (updatedUser.wallet_id) {
            fetchTransactions(updatedUser.wallet_id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchTransactions = async (walletId) => {
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleAdjustBalance = async (type) => {
    if (!selectedUser || !adjustAmount || !adjustReason) {
      alert('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    const amount = parseInt(adjustAmount);
    const finalAmount = type === 'plus' ? amount : -amount;

    try {
      const { error } = await supabase.rpc('admin_adjust_balance', {
        p_user_id: selectedUser.id,
        p_amount: finalAmount,
        p_type: 'admin_adjustment',
        p_note: adjustReason
      });

      if (error) throw error;

      alert('Đã cập nhật số dư thành công!');
      setAdjustAmount('');
      setAdjustReason('');
      fetchUsers();
      if (selectedUser.wallet_id) {
        fetchTransactions(selectedUser.wallet_id);
      }
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="wallet-management">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="tet-section-title" style={{ margin: 0 }}>Quản Lý Ví</h1>
        <motion.button
          className="tet-button-outline"
          onClick={() => fetchUsers(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Tải lại dữ liệu"
        >
          <BiRefresh size={20} />
        </motion.button>
      </div>
      <div className="row g-4">
        <div className="col-md-5">
          <div className="admin-card tet-glass p-4 h-100">
            <h5 className="mb-4 fw-bold"><BiSearch className="me-2" />Tìm kiếm người chơi</h5>
            <input 
              type="text" 
              className="tet-input mb-3" 
              placeholder="Nhập tên nhân vật..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="user-list overflow-auto" style={{ maxHeight: '400px' }}>
              {loading ? (
                <div className="text-center py-4"><div className="spinner-border text-danger spinner-border-sm"></div></div>
              ) : filteredUsers.map(user => (
                <div 
                  key={user.id} 
                  className={`p-3 border rounded mb-2 cursor-pointer transition-all ${selectedUser?.id === user.id ? 'bg-danger text-white border-danger' : 'hover-bg-light'}`}
                  onClick={() => {
                    setSelectedUser(user);
                    if (user.wallet_id) fetchTransactions(user.wallet_id);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold">{user.username}</span>
                    <span className="small">{(user.display_balance || 0).toLocaleString()} VNĐ</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-md-7">
          {selectedUser ? (
            <div className="d-flex flex-column gap-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="admin-card tet-glass p-4">
                <h5 className="mb-4 fw-bold"><BiWallet className="me-2 text-danger" />Điều chỉnh số dư: {selectedUser.username}</h5>
                <div className="mb-3">
                  <label className="small fw-bold mb-1">Số tiền (VNĐ)</label>
                  <input 
                    type="number" 
                    className="tet-input" 
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="Ví dụ: 50000"
                  />
                </div>
                <div className="mb-4">
                  <label className="small fw-bold mb-1">Lý do điều chỉnh</label>
                  <textarea 
                    className="tet-input" 
                    rows="2"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="Ví dụ: Nạp thẻ tháng 1, Hoàn tiền lỗi..."
                  />
                </div>
                <div className="row g-2">
                  <div className="col-6">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAdjustBalance('plus')} 
                      className="tet-button-shop w-100 py-2"
                    >
                      <BiPlus className="me-1" /> Cộng Tiền
                    </motion.button>
                  </div>
                  <div className="col-6">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAdjustBalance('minus')} 
                      className="btn btn-outline-danger w-100 py-2 fw-bold"
                      style={{ border: '2px solid' }}
                    >
                      <BiMinus className="me-1" /> Trừ Tiền
                    </motion.button>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="admin-card tet-glass p-4">
                <h5 className="mb-4 fw-bold"><BiHistory className="me-2 text-danger" />Giao dịch gần đây</h5>
                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <thead>
                      <tr>
                        <th className="small">Thời gian</th>
                        <th className="small text-center">+/-</th>
                        <th className="small text-end">Lý do</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length > 0 ? (
                        transactions.map(t => (
                          <tr key={t.id}>
                            <td className="small text-muted">{new Date(t.created_at).toLocaleString('vi-VN')}</td>
                            <td className={`small text-center fw-bold ${t.amount > 0 ? 'text-success' : 'text-danger'}`}>
                              {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}
                            </td>
                            <td className="small text-end text-truncate" style={{ maxWidth: '150px' }} title={t.note}>{t.note}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center py-4 text-muted small">Chưa có giao dịch nào</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="admin-card tet-glass p-5 text-center text-muted h-100 d-flex align-items-center justify-content-center">
              Vui lòng chọn một người chơi để xem chi tiết và điều chỉnh số dư.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletManagement;
