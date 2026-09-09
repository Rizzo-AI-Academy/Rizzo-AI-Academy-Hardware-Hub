'use client';

import { useState } from 'react';

export default function Gallery({ images, name }) {
  const list = images?.length ? images : ['/hardware-images/placeholder.svg'];
  const [active, setActive] = useState(0);
  return (
    <div className="detail-gallery">
      <img src={list[active]} alt={name} />
      {list.length > 1 && (
        <div className="detail-thumbs">
          {list.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={`${name} — immagine ${i + 1}`}
              className={i === active ? 'active' : ''}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
