import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

import { COLORS } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';

const CAT_SIZE = 140;
const CAT_OVERLAP = 70;

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskTitle: string;
}

export function DeleteTaskModal({ visible, onClose, onConfirm, taskTitle }: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.wrapper}>
          <View style={styles.catFloat} pointerEvents="none">
            <Image
              source={require('@/assets/animations/Blinking Kitty.gif')}
              style={styles.catImage}
              contentFit="contain"
            />
          </View>
          <View style={styles.card}>
            <View style={styles.content}>
              <Text style={styles.title}>Delete Event?</Text>
              <Text style={styles.message}>
                Are you sure you want to delete &quot;{taskTitle}&quot;?
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={onClose}
                  activeOpacity={0.85}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.deleteBtn]}
                  onPress={onConfirm}
                  activeOpacity={0.85}
                >
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26,26,46,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  wrapper: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  catFloat: {
    width: CAT_SIZE,
    height: CAT_SIZE,
    backgroundColor: 'transparent',
    marginBottom: -CAT_OVERLAP,
    left: 100,
    zIndex: 10,
  },
  catImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  card: {
    backgroundColor: COLORS.CARD,
    borderRadius: 24,
    width: '100%',
    shadowColor: COLORS.BACKGROUND,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    overflow: 'visible',
    zIndex: 12,
  },
  content: {
    alignItems: 'center',
    paddingTop: CAT_OVERLAP + 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  title: {
    fontFamily: FontFamily.BOLD,
    fontSize: 20,
    color: COLORS.DARK_TEXT,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 14,
    color: COLORS.MUTED_ON_CARD,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: { flexDirection: 'row', gap: 12, width: '100%' },
  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: COLORS.INPUT_BG,
    borderWidth: 1.5,
    borderColor: COLORS.INPUT_BORDER,
  },
  deleteBtn: { backgroundColor: '#FF4757' },
  cancelBtnText: {
    fontFamily: FontFamily.BOLD,
    color: COLORS.MUTED_ON_CARD,
    fontSize: 15,
  },
  deleteBtnText: {
    fontFamily: FontFamily.BOLD,
    color: COLORS.WHITE_TEXT,
    fontSize: 15,
  },
});
