'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="game-screen">
      <div className="screen-gloss"></div>

      <div className="top-bar">
        <div className="hi-score">
          <span>HI-SCORE</span>
          <p>123000</p>
        </div>
        <div className="hearts">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i}>🧡</span>
          ))}
        </div>
      </div>

      <div className="title">Flail HUB</div>
      <div className="prompt">ARE YOU READY?</div>

      <div className="choices">
        <Link href="/hub" className="choice selected">YES</Link>
        <Link href="/hub" className="choice">NO</Link>
      </div>
    </div>
  );
}
