'use client';

import Image from 'next/image';
import Link from 'next/link';

interface GameCardProps {
  title: string;
  image: string;
  href: string;
}

export default function GameCard({ title, image, href }: GameCardProps) {
  return (
    <Link href={href} className="game-card">
      <Image src={image} alt={title} width={200} height={200} className="game-image" />
      <h2 className="game-title">{title}</h2>
    </Link>
  );
}
