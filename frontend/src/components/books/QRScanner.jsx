import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

export default function QRScanner({ onScan, active = true }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const readerRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
      if (result) {
        onScan(result.getText());
      }
      if (err && err.name !== 'NotFoundException') {
        setError('Không thể truy cập camera');
      }
    }).catch(() => setError('Không thể truy cập camera. Vui lòng cấp quyền.'));

    return () => reader.reset();
  }, [active, onScan]);

  return (
    <div className="qr-scanner">
      {error && <div className="alert alert-warning">{error}</div>}
      <video ref={videoRef} className="w-100 rounded border" style={{ maxHeight: 400, objectFit: 'cover' }} />
      <p className="text-muted small mt-2 text-center">Đưa mã QR vào khung hình để quét</p>
    </div>
  );
}
