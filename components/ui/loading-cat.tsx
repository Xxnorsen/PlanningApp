import React from 'react';
import LottieView from 'lottie-react-native';

interface LoadingCatProps {
  size?: number;
}

export function LoadingCat({ size = 180 }: LoadingCatProps) {
  return (
    <LottieView
      source={require('@/assets/animations/Loading Cat.json')}
      autoPlay
      loop
      style={{ width: size, height: size }}
    />
  );
}
