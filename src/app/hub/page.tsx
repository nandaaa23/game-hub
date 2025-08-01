'use client';

import GameCard from '@/components/GameCard';

const games = [
  { title: 'Brick Breaker', image: '/gamecard/brickbreaker.png', href: '/games/brickbreaker' },
  { title: 'Fruit Ninja', image: '/gamecard/fruitninja.png', href: '/games/fruitninja' },
  { title: 'Flappy Bird', image: '/gamecard/flappybird.png', href: '/games/flappybird' },
  { title: 'Draw Game', image: '/gamecard/draw.png', href: '/games/draw' },
];

export default function HubPage() {
  return (
    <div className="hub-container">
      <h1 className="hub-title">🎮 Welcome to Game Hub 🎮</h1>
      <div className="game-grid">
        {games.map((game) => (
          <GameCard
            key={game.title}
            title={game.title}
            image={game.image}
            href={game.href}
          />
        ))}
      </div>
    </div>
  );
}
