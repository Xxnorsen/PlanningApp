import React from 'react';
import { Image } from 'react-native';

interface LoadingCatProps {
  size?: number;
}

export function LoadingCat({ size = 180 }: LoadingCatProps) {
  return (
    <Image
      source={require('@/assets/animations/Loading Cat.gif')}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
