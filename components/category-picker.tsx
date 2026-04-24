import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import { LoadingCat } from '@/components/ui/loading-cat';
import { useCategories } from '@/context/category-context';
import { showApiErrorAlert, toApiError } from '@/services/api/errors';

const CATEGORY_COLORS = ['#4A4AE8', '#FF9BCC', '#C8FF3E', '#FFA502', '#2ED573', '#FF4757', '#7070CC'];

interface Props {
  value: string | undefined;
  onChange: (id: string | undefined) => void;
  open: boolean;
  onToggle: () => void;
  arrowRotation?: Animated.AnimatedInterpolation<string | number>;
  activeFieldStyle?: boolean;
}

export function CategoryPicker({
  value,
  onChange,
  open,
  onToggle,
  arrowRotation,
  activeFieldStyle = false,
}: Props) {
  const { categories, createCategory } = useCategories();
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const selected = categories.find(c => c.id === value);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const color = CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length];
      const cat = await createCategory({ name, color });
      onChange(cat.id);
      setNewName('');
      setShowNewInput(false);
      onToggle();
    } catch (e) {
      showApiErrorAlert(toApiError(e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.fieldCard, activeFieldStyle && open && styles.fieldCardActive]}
        activeOpacity={0.8}
        onPress={onToggle}
      >
        <View style={styles.fieldRow}>
          <View style={[styles.iconContainer, { backgroundColor: '#FDECF1' }]}>
            <Ionicons name="grid-outline" size={18} color="#E91E63" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.label}>Category</Text>
            <Text style={styles.valueText}>{selected?.name ?? 'None'}</Text>
          </View>
          {arrowRotation ? (
            <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
              <Ionicons name="chevron-down" size={18} color={COLORS.MUTED_ON_CARD} />
            </Animated.View>
          ) : (
            <Ionicons
              name={open ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={COLORS.MUTED_ON_CARD}
            />
          )}
        </View>
      </TouchableOpacity>

      {open && (
        <View style={[styles.dropdownMenu, activeFieldStyle && styles.dropdownAttached]}>
          <TouchableOpacity
            style={[styles.optionItem, styles.optionBorder]}
            onPress={() => {
              onChange(undefined);
              onToggle();
            }}
          >
            <Ionicons name="close-circle-outline" size={18} color={COLORS.MUTED_ON_CARD} />
            <Text style={[styles.optionText, !value && styles.selectedOptionText]}>None</Text>
          </TouchableOpacity>

          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.optionItem, styles.optionBorder]}
              onPress={() => {
                onChange(cat.id);
                onToggle();
              }}
            >
              <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
              <Text
                style={[
                  styles.optionText,
                  value === cat.id && styles.selectedOptionText,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}

          {categories.length === 0 && (
            <Text style={styles.emptyDropdown}>
              No categories yet. Create your first one below.
            </Text>
          )}

          {showNewInput ? (
            <View style={styles.newCatRow}>
              <TextInput
                style={styles.newCatInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Category name"
                placeholderTextColor={COLORS.MUTED_ON_CARD}
                autoFocus
                onSubmitEditing={handleCreate}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[styles.newCatBtn, styles.newCatBtnPrimary]}
                onPress={handleCreate}
                disabled={creating || !newName.trim()}
                activeOpacity={0.85}
              >
                {creating ? (
                  <LoadingCat size={24} />
                ) : (
                  <Ionicons name="checkmark" size={18} color={COLORS.DARK_TEXT} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.newCatBtn}
                onPress={() => {
                  setNewName('');
                  setShowNewInput(false);
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="close" size={18} color={COLORS.MUTED_ON_CARD} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => setShowNewInput(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={18} color={COLORS.BACKGROUND} />
              <Text style={[styles.optionText, { color: COLORS.BACKGROUND, fontFamily: FontFamily.BOLD }]}>
                New Category
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fieldCard: {
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.INPUT_BORDER,
  },
  fieldCardActive: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
  },
  fieldRow: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: { flex: 1 },
  label: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 12,
    color: COLORS.MUTED_ON_CARD,
    marginBottom: 2,
  },
  valueText: {
    fontFamily: FontFamily.BOLD,
    fontSize: 15,
    color: COLORS.DARK_TEXT,
  },
  dropdownMenu: {
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.INPUT_BORDER,
    marginBottom: 12,
    marginTop: -8,
  },
  dropdownAttached: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderTopWidth: 0,
    marginTop: 0,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.INPUT_BORDER,
  },
  optionText: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 15,
    color: COLORS.DARK_TEXT,
  },
  selectedOptionText: {
    fontFamily: FontFamily.BOLD,
    color: COLORS.BACKGROUND,
  },
  emptyDropdown: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 13,
    color: COLORS.MUTED_ON_CARD,
    paddingVertical: 14,
    textAlign: 'center',
  },
  colorDot: { width: 18, height: 18, borderRadius: 9 },
  newCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  newCatInput: {
    flex: 1,
    fontFamily: FontFamily.REGULAR,
    fontSize: 14,
    color: COLORS.DARK_TEXT,
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.INPUT_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  newCatBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.INPUT_BG,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.INPUT_BORDER,
  },
  newCatBtnPrimary: {
    backgroundColor: COLORS.LIME,
    borderColor: COLORS.LIME,
  },
});
