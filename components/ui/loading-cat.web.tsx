import React from 'react';

interface LoadingCatProps {
  size?: number;
}

export function LoadingCat({ size = 180 }: LoadingCatProps) {
  return (
    <video
      src={require('@/assets/animations/Loading Cat.webm')}
      autoPlay
      loop
      muted
      playsInline
      style={{ width: size, height: size, background: 'transparent' }}
    />
  );
}
