'use client';

import React from 'react';
import Image from 'next/image';

const games = [
    { name: "GTA V", hint: "grand theft auto" },
    { name: "God of War", hint: "god of war" },
    { name: "FIFA 2025", hint: "fifa soccer" },
    { name: "Ghost of Tsushima", hint: "ghost of tsushima" },
    { name: "Tekken", hint: "tekken fighting" },
    { name: "Mortal Kombat", hint: "mortal kombat" },
    { name: "NFS", hint: "need for speed" },
    { name: "Prince of Persia", hint: "prince of persia" },
    { name: "Call of Duty", hint: "call of duty" },
];

const colors = [
    "142, 249, 252",
    "142, 252, 204",
    "142, 252, 157",
    "215, 252, 142",
    "252, 252, 142",
    "252, 208, 142",
    "252, 142, 142",
    "252, 142, 239",
    "204, 142, 252",
];

const GameCarousel = () => {
  return (
    <div className="wrapper game-carousel-wrapper">
      <div className="inner" style={{ '--quantity': games.length } as React.CSSProperties}>
        {games.map((game, index) => (
          <div
            key={game.name}
            className="card"
            style={{ '--index': index, '--color-card': colors[index % colors.length] } as React.CSSProperties}
          >
            <div className="img">
              <Image
                src={`https://placehold.co/120x180.png`}
                alt={game.name}
                layout="fill"
                objectFit="cover"
                data-ai-hint={game.hint}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-center">
                <span className="game-title">{game.name}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameCarousel;
