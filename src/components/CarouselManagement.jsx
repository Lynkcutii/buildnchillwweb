import { useState } from 'react';
import { useData } from '../context/DataContext';
import { motion } from 'framer-motion';
import { BiPlus, BiTrash, BiEdit, BiSave, BiX, BiChevronUp, BiChevronDown } from 'react-icons/bi';

const CarouselManagement = () => {
  const { carouselImages, addCarouselImage, updateCarouselImage, deleteCarouselImage } = useData();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ image_url: '', display_order: 0, is_active: true });

  const handleAdd = async (e) => {
    e.preventDefault();
    const success = await addCarouselImage(formData);
    if (success) {
      setIsAdding(false);
      setFormData({ image_url: '', display_order: 0, is_active: true });
    }
  };

  const handleUpdate = async (id) => {
    const success = await updateCarouselImage(id, formData);
    if (success) {
      setEditingId(null);
    }
  };

  const startEdit = (img) => {
    setEditingId(img.id);
    setFormData({ image_url: img.image_url, display_order: img.display_order, is_active: img.is_active });
  };

  const moveOrder = async (img, direction) => {
    const newOrder = direction === 'up' ? img.display_order - 1 : img.display_order + 1;
    await updateCarouselImage(img.id, { display_order: newOrder });
  };

  return (
    <div className="carousel-management">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="tet-title mb-0">Quản Lý Carousel</h3>
        <button 
          className="tet-button"
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingId(null);
            setFormData({ image_url: '', display_order: carouselImages.length, is_active: true });
          }}
        >
          {isAdding ? <><BiX className="me-1" /> Hủy</> : <><BiPlus className="me-1" /> Thêm Ảnh</>}
        </button>
      </div>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card tet-glass p-4 mb-4"
        >
          <form onSubmit={handleAdd}>
            <div className="mb-3">
              <label className="form-label">URL Hình Ảnh</label>
              <input 
                type="text" 
                className="form-control tet-input" 
                value={formData.image_url}
                onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                required
              />
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Thứ Tự Hiển Thị</label>
                <input 
                  type="number" 
                  className="form-control tet-input" 
                  value={formData.display_order}
                  onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
                />
              </div>
              <div className="col-md-6 mb-3 d-flex align-items-end">
                <div className="form-check mb-2">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="isActiveCheck"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  <label className="form-check-label" htmlFor="isActiveCheck">
                    Hoạt động
                  </label>
                </div>
              </div>
            </div>
            <button type="submit" className="tet-button w-100">
              <BiSave className="me-1" /> Lưu Ảnh Carousel
            </button>
          </form>
        </motion.div>
      )}

      <div className="row g-4">
        {carouselImages.map((img) => (
          <div key={img.id} className="col-md-6 col-lg-4">
            <div className="card tet-glass h-100">
              <div className="position-relative">
                <img 
                  src={img.image_url} 
                  className="card-img-top" 
                  alt="Carousel" 
                  style={{ height: '150px', objectFit: 'cover' }}
                />
                {!img.is_active && (
                  <div className="position-absolute top-0 end-0 m-2">
                    <span className="badge bg-secondary">Ẩn</span>
                  </div>
                )}
              </div>
              <div className="card-body">
                {editingId === img.id ? (
                  <div>
                    <input 
                      type="text" 
                      className="form-control tet-input mb-2" 
                      value={formData.image_url}
                      onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    />
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-success flex-grow-1" onClick={() => handleUpdate(img.id)}>
                        <BiSave />
                      </button>
                      <button className="btn btn-sm btn-secondary flex-grow-1" onClick={() => setEditingId(null)}>
                        <BiX />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <span className="badge bg-primary me-2"># {img.display_order}</span>
                      <small className="text-muted">ID: {img.id.substring(0, 8)}...</small>
                    </div>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => moveOrder(img, 'up')} title="Dịch lên">
                        <BiChevronUp />
                      </button>
                      <button className="btn btn-sm btn-outline-primary" onClick={() => moveOrder(img, 'down')} title="Dịch xuống">
                        <BiChevronDown />
                      </button>
                      <button className="btn btn-sm btn-outline-warning" onClick={() => startEdit(img)}>
                        <BiEdit />
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => deleteCarouselImage(img.id)}>
                        <BiTrash />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {carouselImages.length === 0 && (
        <div className="text-center py-5">
          <p className="text-muted">Chưa có ảnh nào trong carousel. Vui lòng thêm ảnh mới.</p>
        </div>
      )}
    </div>
  );
};

export default CarouselManagement;
