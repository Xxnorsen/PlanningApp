// Native — uses GIF (supported on iOS/Android/web)
import React from 'react';
import { Image, StyleSheet } from 'react-native';

export function HeaderLottie() {
  return (
    <Image
      source={require('@/assets/animations/Le Petit Chat _Cat_ Noir.gif')}
      style={styles.cat}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  cat: {
    width: 120,
    height: 120,
  },
});
