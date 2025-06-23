'use client';

import React from 'react';
import Image from 'next/image';

const games = [
    { name: "GTA V", hint: "grand theft auto", img: '/images/gtav.png' },
    { name: "God of War", hint: "god of war", img: '/images/gow.png'  },
    { name: "FIFA 2025", hint: "fifa soccer", img: '/images/fifa25.png'  },
    { name: "Ghost of Tsushima", hint: "ghost of tsushima", img: '/images/gow.png'  },
    { name: "Tekken", hint: "tekken fighting", img: '/images/gow.png' },
    { name: "Mortal Kombat", hint: "mortal kombat", img: '/images/gow.png' },
    { name: "NFS", hint: "need for speed", img: '/images/gow.png' },
    { name: "Prince of Persia", hint: "prince of persia", img: '/images/gow.png' },
    { name: "Call of Duty", hint: "call of duty", img: '/images/gow.png' },
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

const gameImages = [
    'images/gow.png'
]


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
                src={game.img}
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
