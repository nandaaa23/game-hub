'use client';

export default function FruitNinjaPage() {
  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        backgroundColor: '#1a1a1a',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1rem',
      }}
    >
      <iframe
        src={`/fruitninja/index.html`}
        title="Body & Hand Tracking Fruit Ninja"
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