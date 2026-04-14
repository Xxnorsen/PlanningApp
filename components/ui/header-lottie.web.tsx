import React from 'react';

export function HeaderLottie() {
  return (
    <div style={{ mixBlendMode: 'multiply' as const }}>
      <video
        src={require('@/assets/animations/Le Petit Chat _Cat_ Noir.webm')}
        autoPlay
        loop
        muted
        playsInline
        style={{ width: 140, height: 140, background: 'transparent' }}
      />
    </div>
  );
}
