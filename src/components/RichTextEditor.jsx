import { useRef, useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './RichTextEditor.css';

const RichTextEditor = ({ value, onChange, placeholder = 'Nhập nội dung...' }) => {
  const quillRef = useRef(null);
  const [showHtml, setShowHtml] = useState(false);

  useEffect(() => {
    // Đã gỡ bỏ bộ lọc Clipboard cũ để cho phép nhận HTML đầy đủ hơn
  }, []);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': [] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['clean'],
      ['code-block']
    ],
    clipboard: {
      matchVisual: false,
    }
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'color', 'background',
    'align',
    'link', 'image', 'video',
    'code-block'
  ];

  return (
    <div className="rich-text-editor-wrapper">
      <div className="d-flex justify-content-end mb-2">
        <button
          type="button"
          className="btn btn-sm btn-outline-primary"
          onClick={() => setShowHtml(!showHtml)}
          style={{ fontSize: '0.75rem' }}
        >
          {showHtml ? '👁️ Xem kết quả' : '💻 Nhập mã HTML'}
        </button>
      </div>

      {showHtml ? (
        <textarea
          className="form-control"
          style={{
            minHeight: '300px',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            backgroundColor: '#1a1a1a',
            color: '#00ff00',
            border: '2px solid #333'
          }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Dán mã HTML vào đây..."
        />
      ) : (
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
        />
      )}
    </div>
  );
};

export default RichTextEditor;

