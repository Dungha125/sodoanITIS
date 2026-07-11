export default function LoadingSpinner({ text = 'Đang tải...' }) {
  return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">{text}</span>
      </div>
      <p className="mt-2 text-muted">{text}</p>
    </div>
  );
}
