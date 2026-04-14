// Native fallback — ActivityIndicator (webm not supported on iOS/Android)
import React from 'react';
import { ActivityIndicator } from 'react-native';

interface LoadingCatProps {
  size?: number;
}

export function LoadingCat({ size = 180 }: LoadingCatProps) {
  return (
    <ActivityIndicator
      size={size > 60 ? 'large' : 'small'}
      color="#C8FF3E"
    />
  );
}
