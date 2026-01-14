import { useRef, useEffect, useState, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './RichTextEditor.css';
import { supabase } from '../supabaseClient';

const RichTextEditor = ({ value, onChange, placeholder = 'Nhập nội dung...' }) => {
  const quillRef = useRef(null);
  const [showHtml, setShowHtml] = useState(false);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
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
      handlers: {
        image: function() {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.click();

          input.onchange = async () => {
            const file = input.files[0];
            if (file) {
              if (file.size > 10 * 1024 * 1024) {
                alert('Kích thước ảnh tối đa 10MB!');
                return;
              }

              try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                const filePath = fileName;

                const { error: uploadError } = await supabase.storage
                  .from('news')
                  .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                  .from('news')
                  .getPublicUrl(filePath);

                const quill = this.quill;
                const range = quill.getSelection();
                if (range) {
                  quill.insertEmbed(range.index, 'image', publicUrl);
                } else {
                  quill.insertEmbed(quill.getLength(), 'image', publicUrl);
                }
              } catch (error) {
                console.error('Error uploading image to editor:', error);
                alert('Lỗi khi tải ảnh lên: ' + error.message);
              }
            }
          };
        }
      }
    },
    clipboard: {
      matchVisual: false,
    }
  }), []);

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
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Dán mã HTML vào đây..."
        />
      ) : (
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value || ''}
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

