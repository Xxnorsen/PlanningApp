import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

import { COLORS } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import { useCategories } from '@/context/category-context';
import { LoadingCat } from '@/components/ui/loading-cat';
import type { Category } from '@/types/category';

// ─── Palette & icons ──────────────────────────────────────────────────────────

const PALETTE = [
  '#4A4AE8', '#C8FF3E', '#FF4757', '#FFA502',
  '#2ED573', '#FF9BCC', '#7070CC', '#1E90FF',
  '#FF6B6B', '#FFEAA7', '#00CEC9', '#6C5CE7',
];

const ICONS = [
  'briefcase-outline', 'fitness-outline', 'cart-outline',
  'home-outline', 'book-outline', 'musical-notes-outline',
  'airplane-outline', 'heart-outline', 'star-outline',
  'camera-outline', 'code-slash-outline', 'leaf-outline',
  'game-controller-outline', 'restaurant-outline', 'car-outline',
  'people-outline', 'globe-outline', 'wallet-outline',
];

// ─── Types ────────────────────────────────────────────────────────────────────

type FormState = { name: string; color: string; icon: string };

const DEFAULT_FORM: FormState = { name: '', color: PALETTE[0], icon: ICONS[0] };

// ─── Category row ─────────────────────────────────────────────────────────────

function CategoryRow({
  category,
  onEdit,
  onDelete,
}: {
  category: Category;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: category.color + '22' }]}>
        <Ionicons name={(category.icon ?? 'grid-outline') as any} size={22} color={category.color} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{category.name}</Text>
        <Text style={styles.rowCount}>{category.taskCount ?? 0} Events</Text>
      </View>
      <TouchableOpacity style={styles.actionBtn} onPress={onEdit} activeOpacity={0.7}>
        <Ionicons name="pencil-outline" size={17} color={COLORS.MUTED_ON_CARD} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={onDelete} activeOpacity={0.7}>
        <Ionicons name="trash-outline" size={17} color="#FF4757" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Form modal (create / edit) ───────────────────────────────────────────────

function FormModal({
  visible,
  initial,
  onSave,
  onClose,
  busy,
}: {
  visible: boolean;
  initial: Category | null;
  onSave: (form: FormState) => void;
  onClose: () => void;
  busy: boolean;
}) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (visible) {
      setForm(initial
        ? { name: initial.name, color: initial.color ?? PALETTE[0], icon: initial.icon ?? ICONS[0] }
        : DEFAULT_FORM);
      setError('');
    }
  }, [visible, initial]);

  const set = (patch: Partial<FormState>) => setForm(f => ({ ...f, ...patch }));

  const submit = () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    onSave({ ...form, name: form.name.trim() });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{initial ? 'Edit Category' : 'New Category'}</Text>

          {/* Live preview */}
          <View style={[styles.preview, { backgroundColor: form.color + '22' }]}>
            <Ionicons name={form.icon as any} size={32} color={form.color} />
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={15} color="#fff" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Name */}
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={[styles.input, !!error && !form.name.trim() && styles.inputError]}
            value={form.name}
            onChangeText={v => { set({ name: v }); setError(''); }}
            placeholder="e.g. Work, Fitness…"
            placeholderTextColor={COLORS.MUTED_ON_CARD}
            autoFocus
          />

          {/* Color */}
          <Text style={styles.label}>Color</Text>
          <View style={styles.palette}>
            {PALETTE.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.swatch, { backgroundColor: c }, form.color === c && styles.swatchActive]}
                onPress={() => set({ color: c })}
                activeOpacity={0.8}
              />
            ))}
          </View>

          {/* Icon */}
          <Text style={styles.label}>Icon</Text>
          <View style={styles.iconGrid}>
            {ICONS.map(ic => (
              <TouchableOpacity
                key={ic}
                style={[styles.iconBtn, form.icon === ic && { backgroundColor: form.color + '33', borderColor: form.color }]}
                onPress={() => set({ icon: ic })}
                activeOpacity={0.8}
              >
                <Ionicons name={ic as any} size={20} color={form.icon === ic ? form.color : COLORS.MUTED_ON_CARD} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={submit} disabled={busy} activeOpacity={0.85}>
            {busy ? <LoadingCat size={36} /> : <Text style={styles.saveBtnText}>{initial ? 'Save Changes' : 'Create Category'}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Delete modal ─────────────────────────────────────────────────────────────

function DeleteModal({
  category,
  onConfirm,
  onCancel,
  busy,
  error,
}: {
  category: Category | null;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
  error: string;
}) {
  return (
    <Modal visible={!!category} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.delOverlay}>
        <View style={styles.delCard}>
          <View style={styles.delIconWrap}>
            <Ionicons name="trash-outline" size={26} color="#FF4757" />
          </View>
          <Text style={styles.delTitle}>Delete &quot;{category?.name}&quot;?</Text>
          <Text style={styles.delBody}>Events in this category will be uncategorised.</Text>

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={15} color="#fff" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.delBtn} onPress={onConfirm} disabled={busy} activeOpacity={0.85}>
            {busy
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.delBtnText}>Delete</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={busy} activeOpacity={0.7}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CategoriesScreen() {
  const router = useRouter();
  const { categories, isLoading, fetchAll, createCategory, updateCategory, deleteCategory } = useCategories();

  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [formBusy, setFormBusy] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useFocusEffect(useCallback(() => { fetchAll(); }, []));

  // Form
  const openCreate = () => { setEditing(null); setFormVisible(true); };
  const openEdit = (c: Category) => { setEditing(c); setFormVisible(true); };
  const closeForm = () => { setFormVisible(false); setEditing(null); };

  const handleSave = async (form: FormState) => {
    setFormBusy(true);
    try {
      if (editing) {
        await updateCategory(editing.id, form);
      } else {
        await createCategory(form);
      }
      closeForm();
    } catch {
      // error shown by context
    } finally {
      setFormBusy(false);
    }
  };

  // Delete
  const openDelete = (c: Category) => { setDeleteError(''); setDeleteTarget(c); };
  const closeDelete = () => { setDeleteTarget(null); setDeleteError(''); };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    setDeleteError('');
    try {
      await deleteCategory(deleteTarget.id);
      closeDelete();
    } catch (e: any) {
      setDeleteError(e?.message ?? 'Could not delete. Please try again.');
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={COLORS.WHITE_TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate} activeOpacity={0.8}>
          <Ionicons name="add" size={22} color={COLORS.DARK_TEXT} />
        </TouchableOpacity>
      </View>

      {/* List */}
      {isLoading && categories.length === 0 ? (
        <View style={styles.center}><LoadingCat size={120} /></View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {categories.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="grid-outline" size={38} color={COLORS.MUTED_ON_CARD} />
              </View>
              <Text style={styles.emptyTitle}>No categories yet</Text>
              <Text style={styles.emptySub}>Create one to organise your events</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={openCreate} activeOpacity={0.85}>
                <Ionicons name="add" size={16} color={COLORS.DARK_TEXT} />
                <Text style={styles.emptyBtnText}>Create Category</Text>
              </TouchableOpacity>
            </View>
          ) : (
            categories.map(cat => (
              <CategoryRow
                key={cat.id}
                category={cat}
                onEdit={() => openEdit(cat)}
                onDelete={() => openDelete(cat)}
              />
            ))
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      <FormModal
        visible={formVisible}
        initial={editing}
        onSave={handleSave}
        onClose={closeForm}
        busy={formBusy}
      />

      <DeleteModal
        category={deleteTarget}
        onConfirm={confirmDelete}
        onCancel={closeDelete}
        busy={deleteBusy}
        error={deleteError}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.BACKGROUND },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FontFamily.BOLD, fontSize: 20, color: COLORS.WHITE_TEXT },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.LIME, alignItems: 'center', justifyContent: 'center' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  scroll: { flex: 1, backgroundColor: COLORS.INPUT_BG, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  list: { padding: 20, gap: 12 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.CARD, borderRadius: 16, padding: 14 },
  rowIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1 },
  rowName: { fontFamily: FontFamily.BOLD, fontSize: 15, color: COLORS.DARK_TEXT },
  rowCount: { fontFamily: FontFamily.REGULAR, fontSize: 12, color: COLORS.MUTED_ON_CARD, marginTop: 2 },
  actionBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.INPUT_BG, alignItems: 'center', justifyContent: 'center' },
  actionBtnDanger: { backgroundColor: '#FFF0F1' },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: COLORS.CARD, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: FontFamily.BOLD, fontSize: 18, color: COLORS.DARK_TEXT },
  emptySub: { fontFamily: FontFamily.REGULAR, fontSize: 14, color: COLORS.MUTED_ON_CARD, textAlign: 'center' },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.LIME, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 8 },
  emptyBtnText: { fontFamily: FontFamily.BOLD, fontSize: 14, color: COLORS.DARK_TEXT },

  // Shared modal pieces
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { backgroundColor: COLORS.CARD, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.INPUT_BORDER, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontFamily: FontFamily.BOLD, fontSize: 20, color: COLORS.DARK_TEXT, marginBottom: 16 },

  preview: { width: 64, height: 64, borderRadius: 18, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FF4757', borderRadius: 12, padding: 12, marginBottom: 12 },
  errorText: { fontFamily: FontFamily.REGULAR, fontSize: 13, color: '#fff', flex: 1 },

  label: { fontFamily: FontFamily.BOLD, fontSize: 13, color: COLORS.BACKGROUND, marginBottom: 8 },
  input: { backgroundColor: COLORS.INPUT_BG, borderRadius: 12, borderWidth: 1, borderColor: COLORS.INPUT_BORDER, paddingHorizontal: 14, paddingVertical: 12, fontFamily: FontFamily.REGULAR, fontSize: 15, color: COLORS.DARK_TEXT, marginBottom: 16 },
  inputError: { borderColor: '#FF4757' },

  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  swatch: { width: 32, height: 32, borderRadius: 16 },
  swatchActive: { borderWidth: 3, borderColor: COLORS.DARK_TEXT },

  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  iconBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.INPUT_BG, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },

  saveBtn: { height: 52, borderRadius: 26, backgroundColor: COLORS.LIME, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  saveBtnText: { fontFamily: FontFamily.BOLD, fontSize: 16, color: COLORS.DARK_TEXT },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelBtnText: { fontFamily: FontFamily.REGULAR, fontSize: 15, color: COLORS.MUTED_ON_CARD },

  // Delete modal
  delOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  delCard: { backgroundColor: COLORS.CARD, borderRadius: 24, padding: 24, width: '100%', alignItems: 'center' },
  delIconWrap: { width: 60, height: 60, borderRadius: 18, backgroundColor: '#FFF0F1', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  delTitle: { fontFamily: FontFamily.BOLD, fontSize: 17, color: COLORS.DARK_TEXT, marginBottom: 6, textAlign: 'center' },
  delBody: { fontFamily: FontFamily.REGULAR, fontSize: 14, color: COLORS.MUTED_ON_CARD, textAlign: 'center', marginBottom: 20 },
  delBtn: { height: 48, borderRadius: 24, backgroundColor: '#FF4757', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 4 },
  delBtnText: { fontFamily: FontFamily.BOLD, fontSize: 15, color: '#fff' },
});
