'use client';

import React from 'react';
import Image from 'next/image';

const games = [
    { name: "GTA V", hint: "grand theft auto", img: '/images/gtav.png' },
    { name: "G.O.W", hint: "god of war", img: '/images/gow.png'  },
    { name: "FIFA 25", hint: "fifa soccer", img: '/images/fifa25.png'  },
    { name: "G.O.T", hint: "ghost of tsushima", img: '/images/ghostoftshushima.png'  },
    { name: "Tekken 8", hint: "tekken fighting", img: '/images/tekken.png' },
    { name: "M.K 11", hint: "mortal kombat", img: '/images/mortalcombat.png' },
    { name: "B.M.W", hint: "black myth wukong", img: '/images/blackmythwukong.png' },
    { name: "W.W.E 25", hint: "wwe", img: '/images/wwe.png' },
    { name: "Call of Duty", hint: "call of duty", img: '/images/cod.png' },
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
