import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { BiCheck, BiX, BiSearch, BiTime, BiWallet, BiImage } from 'react-icons/bi';

const RECHARGE_WEBHOOK_URL = 'https://discord.com/api/webhooks/1467696152559227063/ms7Z7n4a6btul6Wlie0ugrjIN7HZTtdCVOrJFddUXjiFwdi0-TNjfJ_u6f9yFwyqD4ir';

const RechargeManagement = () => {
  const [recharges, setRecharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('pending');
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchRecharges();

    const handleUpdate = () => {
      fetchRecharges();
    };

    window.addEventListener('recharge_updated', handleUpdate);
    return () => window.removeEventListener('recharge_updated', handleUpdate);
  }, [filter]);

  const fetchRecharges = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('recharges')
        .select(`
          *,
          user_profile:profiles!user_id (
            username
          )
        `)
        .order('created_at', { ascending: false });
      
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setRecharges(data || []);
    } catch (error) {
      console.error('Error fetching recharges:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendRechargeDiscordNotification = async (recharge, status) => {
    const statusLabel = status === 'approved' ? 'NẠP THÈ THÀNH CÔNG' : 'YÊU CẦU NẠP BỊ TỪ CHỐI';
    const statusColor = status === 'approved' ? 3066993 : 15158332; // Green for approved, Red for rejected

    const embed = {
      title: `💰 ${statusLabel}`,
      description: status === 'approved'
        ? `✅ Yêu cầu nạp tiền của **${recharge.user_profile?.username}** đã được duyệt!`
        : `❌ Yêu cầu nạp tiền của **${recharge.user_profile?.username}** đã bị từ chối.`,
      color: statusColor,
      fields: [
        { name: '👤 Người chơi', value: recharge.user_profile?.username || 'Không rõ', inline: true },
        { name: '💰 Số tiền', value: `${Number(recharge.amount || 0).toLocaleString('vi-VN')} VNĐ`, inline: true },
        { name: '💳 Phương thức', value: recharge.payment_method === 'bank' ? 'Chuyển khoản ngân hàng' : recharge.payment_method, inline: true },
        { name: '🆔 Mã yêu cầu', value: `\`${recharge.id}\`` },
        { name: '✅ Trạng thái hiện tại', value: `**${status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}**` }
      ],
      footer: { text: 'BuildnChill System - Recharge Status Updated' },
      timestamp: new Date().toISOString()
    };

    if (recharge.proof_image) {
      embed.image = { url: recharge.proof_image };
    }

    try {
      if (recharge.discord_message_id) {
        console.log(`Editing Discord message: ${recharge.discord_message_id}`);
        // Edit existing message
        const response = await fetch(`${RECHARGE_WEBHOOK_URL}/messages/${recharge.discord_message_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            content: '', // Clear the "New Request" notification content
            embeds: [embed] 
          })
        });
        
        if (!response.ok) {
          const errText = await response.text();
          console.error('Discord PATCH error:', errText);
          // Fallback to POST if PATCH fails
          await fetch(RECHARGE_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
          });
        }
      } else {
        console.log('No discord_message_id found, sending new message.');
        // Fallback to new message
        await fetch(RECHARGE_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ embeds: [embed] })
        });
      }
    } catch (error) {
      console.error('Error sending Discord notification:', error);
    }
  };

  const handleAction = async (recharge, status) => {
    const actionText = status === 'approved' ? 'duyệt' : 'từ chối';
    if (!window.confirm(`Bạn có chắc muốn ${actionText} yêu cầu này?`)) return;

    try {
      if (status === 'approved') {
        const { error } = await supabase.rpc('approve_recharge', {
          p_recharge_id: recharge.id,
          p_admin_id: (await supabase.auth.getUser()).data.user.id
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('recharges')
          .update({ status: 'rejected' })
          .eq('id', recharge.id);
        if (error) throw error;
      }

      // Lấy dữ liệu mới nhất để đảm bảo có discord_message_id
      const { data: freshRecharge, error: fetchError } = await supabase
        .from('recharges')
        .select(`
          *,
          user_profile:profiles!user_id (
            username
          )
        `)
        .eq('id', recharge.id)
        .single();

      if (fetchError) {
        console.error('Error fetching fresh recharge data:', fetchError);
      }

      // Gửi thông báo Discord với dữ liệu mới nhất
      await sendRechargeDiscordNotification(freshRecharge || recharge, status);

      alert(`Đã ${actionText} thành công!`);
      fetchRecharges();
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  const filteredRecharges = recharges.filter(r => 
    r.user_profile?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="recharge-management">
      <div className="admin-card tet-glass p-4 mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0"><BiSearch /></span>
              <input 
                type="text" 
                className="tet-input ps-0" 
                placeholder="Tìm tên nhân vật..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-8 text-md-end">
            <div className="btn-group">
              {['pending', 'approved', 'rejected', 'all'].map(s => (
                <button 
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`btn btn-sm ${filter === s ? 'btn-danger' : 'btn-outline-danger'}`}
                >
                  {s === 'pending' ? 'Chờ duyệt' : s === 'approved' ? 'Đã duyệt' : s === 'rejected' ? 'Đã từ chối' : 'Tất cả'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table tet-table align-middle">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Người chơi</th>
              <th>Số tiền</th>
              <th>Hình thức</th>
              <th>Minh chứng</th>
              <th>Trạng thái</th>
              <th className="text-end">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center py-5"><div className="spinner-border text-danger"></div></td></tr>
            ) : filteredRecharges.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-5 text-muted">Không có yêu cầu nào.</td></tr>
            ) : filteredRecharges.map(r => (
              <tr key={r.id}>
                <td>
                  <div className="small text-muted d-flex align-items-center"><BiTime className="me-1" />{new Date(r.created_at).toLocaleString()}</div>
                </td>
                <td><span className="fw-bold">{r.user_profile?.username}</span></td>
                <td><span className="text-danger fw-bold">{r.amount.toLocaleString()} VNĐ</span></td>
                <td><span className="badge bg-light text-dark text-uppercase">{r.payment_method}</span></td>
                <td>
                  {r.proof_image ? (
                    <button onClick={() => setSelectedImage(r.proof_image)} className="btn btn-sm btn-outline-secondary py-0">
                      <BiImage className="me-1" /> Xem ảnh
                    </button>
                  ) : 'N/A'}
                </td>
                <td>
                  <span className={`badge ${r.status === 'pending' ? 'bg-warning' : r.status === 'approved' ? 'bg-success' : 'bg-danger'}`}>
                    {r.status === 'pending' ? 'Chờ duyệt' : r.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}
                  </span>
                </td>
                <td className="text-end">
                  {r.status === 'pending' && (
                    <div className="d-flex justify-content-end gap-2">
                      <button onClick={() => handleAction(r, 'approved')} className="btn btn-sm btn-success p-1" title="Duyệt"><BiCheck size={20} /></button>
                      <button onClick={() => handleAction(r, 'rejected')} className="btn btn-sm btn-danger p-1" title="Từ chối"><BiX size={20} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedImage && (
          <div className="modal-backdrop-custom d-flex align-items-center justify-content-center" onClick={() => setSelectedImage(null)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="p-2 bg-white rounded shadow-lg position-relative"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setSelectedImage(null)} className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2" style={{ zIndex: 10 }}><BiX /></button>
              <img src={selectedImage} alt="Proof" style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain' }} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RechargeManagement;
