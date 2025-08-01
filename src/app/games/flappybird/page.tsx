'use client';

export default function FlappyBirdPage() {
  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        backgroundColor: '#000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <iframe
        src={`/flappybird/index.html`}
        title="Voice Controlled Flappy Bird"
        allow="microphone" 
        style={{
          width: '400px',
          height: '600px',
          border: '3px solid #fff',
          borderRadius: '10px',
        }}
      />
    </div>
  );
}