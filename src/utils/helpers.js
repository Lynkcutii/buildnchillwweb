export const slugify = (text) => {
  if (!text) return '';
  
  return text
    .toString()
    .normalize('NFD')                   // Tách dấu khỏi chữ cái
    .replace(/[\u0300-\u036f]/g, '')     // Xóa các dấu vừa tách
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')                // Thay thế khoảng trắng bằng -
    .replace(/[^\w-]+/g, '')             // Xóa các ký tự đặc biệt không phải chữ cái/số/dấu gạch ngang
    .replace(/--+/g, '-');               // Thay thế nhiều dấu gạch ngang liên tiếp bằng một dấu
};

export const generateOrderCode = (id) => {
  if (!id) return 'DH-UNKNOWN';
  const prefix = 'DH';
  const shortId = id.toString().slice(-6).toUpperCase();
  return `${prefix}-${shortId}`;
};

export const generateContactCode = (id) => {
  if (!id) return 'LH-UNKNOWN';
  const prefix = 'LH';
  const shortId = id.toString().slice(-6).toUpperCase();
  return `${prefix}-${shortId}`;
};
