import React, { useRef, useState } from 'react';

export default function DropZone({ onRead, onReady }) {
  const [dragging,  setDragging]  = useState(false);
  const [fileName,  setFileName]  = useState('');
  const inputRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => { onRead(e.target.result); onReady?.(); };
    reader.readAsText(file);
  };

  return (
    <div
      className={`drop-zone${dragging ? ' dragover' : ''}`}
      onDragOver={e  => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
      onClick={() => inputRef.current.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.doc,.docx"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])}
      />
      <div className="dz-icon-ring">↑</div>
      <div className="dz-title">Drop your file here</div>
      <div className="dz-hint">PDF · DOC · TXT · click to browse</div>
      {fileName && <div className="file-badge">{fileName}</div>}
    </div>
  );
}
