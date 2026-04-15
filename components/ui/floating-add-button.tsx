import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { IconSymbol } from './icon-symbol';

interface FloatingAddButtonProps {
  onPress: () => void;
  color?: string;
}

export function FloatingAddButton({ onPress, color = '#FFFFFF' }: FloatingAddButtonProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.floatingButton} 
        onPress={onPress}
        activeOpacity={0.8}
      >
        <IconSymbol size={32} name="plus" color={color} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A4AE8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
