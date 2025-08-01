'use client';

export default function GamePage() {

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        backgroundColor: '#1e112d',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <iframe
        src={`/brickbreaker/index.html`} 
        width="900"
        height="600"
        title="Brick Breaker Game"
        allow="camera; microphone"
        style={{
          width: '100%',
          height: '100%',
          background: '#000',
        }}
      />
    </div>
  );
}
