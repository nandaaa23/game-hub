'use client';

export default function DrawPage() {
  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        backgroundColor: '#f0f0f0', 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1rem',
      }}
    >
      <iframe
        src={`/draw/index.html`}
        title="Drawing Game"
        style={{
          width: '100%',
          height: '100%',
          boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
        }}
      />
    </div>
  );
}