import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { BiPlusCircle, BiUpload, BiCheckCircle, BiInfoCircle, BiQrScan, BiCreditCard } from 'react-icons/bi';
import TetEffect from '../components/TetEffect';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';

const Recharge = () => {
  const navigate = useNavigate();
  const { userProfile, isAuthenticated, loading } = useData();
  const [uploading, setUploading] = useState(false);
  const [rechargeForm, setRechargeForm] = useState({
    amount: '',
    payment_method: 'bank',
    proof_image: null
  });

  const paymentInfo = {
    bank_account: '0000865746243',
    bank_name: 'MBBank',
    account_name: 'LE DUC TRONG'
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setRechargeForm({ ...rechargeForm, proof_image: e.target.files[0] });
    }
  };

  const handleRechargeSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated || !userProfile) {
      alert('Vui lòng đăng nhập để nạp tiền!');
      navigate('/login');
      return;
    }

    if (!rechargeForm.amount || !rechargeForm.proof_image) {
      alert('Vui lòng nhập số tiền và tải ảnh minh chứng!');
      return;
    }

    setUploading(true);
    try {
      // 1. Upload image
      const fileExt = rechargeForm.proof_image.name.split('.').pop();
      const fileName = `${userProfile.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('recharges')
        .upload(fileName, rechargeForm.proof_image);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Lỗi khi tải ảnh lên: ' + uploadError.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('recharges')
        .getPublicUrl(fileName);

      // 2. Create recharge request
      const { data: rechargeData, error: insertError } = await supabase
        .from('recharges')
        .insert({
          user_id: userProfile.id,
          amount: parseInt(rechargeForm.amount),
          payment_method: rechargeForm.payment_method,
          proof_image: publicUrl,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error('Lỗi khi lưu yêu cầu: ' + insertError.message);
      }

      // Discord notification on submit
      try {
        const RECHARGE_WEBHOOK_URL = 'https://discord.com/api/webhooks/1467696152559227063/ms7Z7n4a6btul6Wlie0ugrjIN7HZTtdCVOrJFddUXjiFwdi0-TNjfJ_u6f9yFwyqD4ir';
        const embed = {
          title: '💰 YÊU CẦU NẠP TIỀN MỚI',
          description: `👤 Người chơi **${userProfile.username}** vừa gửi một yêu cầu nạp tiền!`,
          color: 16766720,
          fields: [
            { name: '👤 Người chơi', value: userProfile.username, inline: true },
            { name: '💰 Số tiền', value: `${Number(rechargeForm.amount).toLocaleString('vi-VN')} VNĐ`, inline: true },
            { name: '💳 Phương thức', value: rechargeForm.payment_method === 'bank' ? 'Chuyển khoản ngân hàng' : rechargeForm.payment_method, inline: true },
            { name: '🆔 Mã yêu cầu', value: `\`${rechargeData.id}\`` }
          ],
          image: { url: publicUrl },
          footer: { text: 'BuildnChill System - New Recharge' },
          timestamp: new Date().toISOString()
        };
        const response = await fetch(`${RECHARGE_WEBHOOK_URL}?wait=true`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            content: '🔔 <@741299302495813662> **YÊU CẦU NẠP TIỀN MỚI**',
            embeds: [embed] 
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.id) {
            console.log('Discord message sent, ID:', data.id);
            // Cập nhật message_id vào record
            const { error: updateError } = await supabase
              .from('recharges')
              .update({ discord_message_id: data.id })
              .eq('id', rechargeData.id);
            
            if (updateError) {
              console.error('Error saving discord_message_id:', updateError);
            } else {
              console.log('Successfully saved discord_message_id to database');
            }
          }
        }
      } catch (discordError) {
        console.error('Discord notification error:', discordError);
      }

      alert('Gửi yêu cầu nạp tiền thành công! Vui lòng chờ Admin duyệt.');
      setRechargeForm({ amount: '', payment_method: 'bank', proof_image: null });
    } catch (error) {
      console.error('Recharge submit error:', error);
      alert('Lỗi: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="text-center py-5 mt-5"><div className="spinner-border text-danger"></div></div>;

  return (
    <div className="shop-tet-container py-5">
      <TetEffect />
      <div className="container">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-5">
          <h1 className="tet-title">Nạp Tiền Vào Ví</h1>
          <p className="text-muted">Nạp tiền để mua sắm vật phẩm cực phẩm tại BuildnChill 🧧</p>
        </motion.div>

        <div className="row justify-content-center">
          <div className="col-lg-12">
            <div className="row g-4">
              {/* Cột trái: Hướng dẫn và QR */}
              <div className="col-lg-5">
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="tet-glass p-4 h-100">
                  <h5 className="fw-bold text-danger mb-4 d-flex align-items-center gap-2">
                    <BiInfoCircle /> Hướng dẫn nạp
                  </h5>
                  
                  <div className="text-center mb-4 p-3 bg-white rounded shadow-sm border border-warning position-relative overflow-hidden">
                    <div className="position-absolute top-0 start-0 w-100 h-100 opacity-05" style={{ background: 'url(/img/tet-pattern.png)', zIndex: 0 }}></div>
                    <div className="position-relative" style={{ zIndex: 1 }}>
                      <img 
                        src={`https://mc-heads.net/avatar/${userProfile?.username}/100`} 
                        alt="avatar" 
                        className="rounded mb-2 shadow-sm"
                        style={{ border: '3px solid var(--tet-lucky-red)', padding: '2px', background: 'white' }}
                      />
                      <div className="fw-black text-danger h5 mb-0">{userProfile?.username}</div>
                      <div className="small text-muted">Người chơi</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="p-3 bg-white rounded border border-danger mb-3 shadow-sm">
                      <div className="small fw-bold text-danger mb-2 d-flex align-items-center gap-2">
                        <BiCreditCard /> Chuyển khoản đến:
                      </div>
                      <div className="d-flex flex-column gap-1 small">
                        <div><strong>Ngân hàng:</strong> <span className="text-dark">{paymentInfo.bank_name}</span></div>
                        <div><strong>Số tài khoản:</strong> <span className="text-danger fw-bold h6">{paymentInfo.bank_account}</span></div>
                        <div><strong>Chủ tài khoản:</strong> <span className="text-dark">{paymentInfo.account_name}</span></div>
                        <div className="bg-danger-subtle p-2 rounded fw-bold text-center border border-danger text-danger mt-2" style={{ fontSize: '1rem' }}>
                          Nội dung: <span className="user-select-all">NAP {userProfile?.username}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <h6 className="fw-bold text-muted mb-3 d-flex align-items-center justify-content-center gap-2">
                      <BiQrScan /> Mã QR Thanh Toán
                    </h6>
                    {rechargeForm.amount && parseInt(rechargeForm.amount) > 0 ? (
                      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <img
                          src={`https://img.vietqr.io/image/MB-${paymentInfo.bank_account}-compact2.png?amount=${rechargeForm.amount}&addInfo=NAP ${userProfile?.username}&accountName=${paymentInfo.account_name}`}
                          alt="VietQR"
                          className="img-fluid rounded shadow-lg border border-warning"
                          style={{ maxWidth: '280px', background: 'white', padding: '10px' }}
                        />
                        <div className="mt-3 small text-muted">Mở App ngân hàng quét mã để tự động điền</div>
                      </motion.div>
                    ) : (
                      <div className="p-5 bg-light rounded border border-dashed text-muted text-center small">
                        <BiQrScan size={60} className="mb-3 d-block mx-auto opacity-20" />
                        Nhập số tiền ở bên phải để tạo mã QR thanh toán nhanh
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Cột phải: Form gửi yêu cầu */}
              <div className="col-lg-7">
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="tet-glass p-4 h-100">
                  <h5 className="fw-bold text-danger mb-4"><BiPlusCircle className="me-2" />Gửi yêu cầu xác nhận</h5>
                  <form onSubmit={handleRechargeSubmit}>
                    <div className="mb-4">
                      <label className="small fw-bold mb-2 text-dark">Số tiền đã chuyển (VNĐ)</label>
                      <div className="position-relative">
                        <input 
                          type="number" className="tet-input ps-4" 
                          placeholder="Ví dụ: 20000" 
                          value={rechargeForm.amount} 
                          onChange={e => setRechargeForm({...rechargeForm, amount: e.target.value})} 
                          required 
                          style={{ fontSize: '1.2rem', fontWeight: 'bold' }}
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="small fw-bold mb-2 text-dark">Phương thức thanh toán</label>
                      <div className="tet-input bg-light d-flex align-items-center gap-3 py-3">
                        <div className="bg-white p-2 rounded shadow-sm">
                          <BiCreditCard className="text-danger" size={24} />
                        </div>
                        <div className="fw-bold">Chuyển khoản ngân hàng (VietQR)</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="small fw-bold mb-2 text-dark">Ảnh minh chứng (Screenshot)</label>
                      <div 
                        className="border rounded p-4 text-center cursor-pointer transition-all position-relative" 
                        style={{ 
                          borderStyle: 'dashed', 
                          borderWidth: '2px',
                          borderColor: rechargeForm.proof_image ? 'var(--tet-lucky-red)' : '#ccc',
                          background: rechargeForm.proof_image ? 'rgba(215, 0, 24, 0.02)' : 'rgba(0,0,0,0.02)' 
                        }} 
                        onClick={() => document.getElementById('recharge-upload').click()}
                      >
                        {rechargeForm.proof_image ? (
                          <div className="text-success fw-bold d-flex flex-column align-items-center justify-content-center gap-2">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                              <BiCheckCircle size={64} />
                            </motion.div>
                            <div className="text-truncate" style={{ maxWidth: '100%' }}>{rechargeForm.proof_image.name}</div>
                            <div className="text-muted small fw-normal">(Click để chọn lại)</div>
                          </div>
                        ) : (
                          <>
                            <BiUpload size={64} className="text-muted mb-2 opacity-50" />
                            <div className="fw-bold h6">Tải ảnh biên lai (Screenshot)</div>
                            <div className="small text-muted">Nhấn vào đây để tải ảnh hoặc chụp màn hình</div>
                          </>
                        )}
                        <input 
                          type="file" id="recharge-upload" className="d-none" 
                          accept="image/*" onChange={handleFileChange} 
                        />
                      </div>
                    </div>

                    <motion.button 
                      type="submit" 
                      className="tet-button-shop w-100 py-3 mt-2" 
                      disabled={uploading}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      style={{ fontSize: '1.1rem', fontWeight: '800' }}
                    >
                      {uploading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          ĐANG XỬ LÝ...
                        </>
                      ) : (
                        <>
                          <BiCheckCircle className="me-2" size={24} />
                          XÁC NHẬN ĐÃ CHUYỂN TIỀN
                        </>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recharge;
