import { useCallback, useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  createCollection,
  getMembership,
  listMyCollections,
  smartSave,
  type ApiCollectionSummary,
  type FavoriteType,
} from "../api/collections";
import { IconCheck, IconX } from "../icons";
import { colors, radii, typography } from "../theme";

type SaveToCollectionSheetProps = {
  visible: boolean;
  type: FavoriteType;
  targetId: string;
  onClose: () => void;
  onSaved?: (saved: boolean, collectionIds: string[]) => void;
};

export function SaveToCollectionSheet({
  visible,
  type,
  targetId,
  onClose,
  onSaved,
}: SaveToCollectionSheetProps) {
  const [collections, setCollections] = useState<ApiCollectionSummary[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newVisibility, setNewVisibility] = useState<"private" | "public">(
    "private",
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, membership] = await Promise.all([
        listMyCollections(),
        getMembership(type, targetId),
      ]);
      setCollections(list);
      setSelected(new Set(membership.collectionIds));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load collections");
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, [type, targetId]);

  useEffect(() => {
    if (visible) {
      setCreating(false);
      setNewName("");
      void load();
    }
  }, [visible, load]);

  const toggleId = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onDone = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await smartSave(type, targetId, [...selected]);
      onSaved?.(result.saved, result.collectionIds);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const onCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createCollection({
        name,
        visibility: newVisibility,
      });
      setCollections((prev) => [...prev, created]);
      setSelected((prev) => new Set([...prev, created.id]));
      setCreating(false);
      setNewName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <View style={{ width: 28 }} />
          <Text style={styles.title}>
            {creating ? "New collection" : "Save to collection"}
          </Text>
          <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close">
            <IconX size={22} color={colors.ink} />
          </Pressable>
        </View>

        {creating ? (
          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>Collection name</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Weekend rotis"
              placeholderTextColor={colors.grayLight}
              autoFocus
            />
            <Text style={styles.label}>Privacy</Text>
            {(
              [
                {
                  id: "private" as const,
                  title: "Private",
                  sub: "Only you can view and edit.",
                },
                {
                  id: "public" as const,
                  title: "Public",
                  sub: "Anyone can find and follow this list.",
                },
              ] as const
            ).map((opt) => {
              const on = newVisibility === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  style={[styles.radioRow, on && styles.radioRowOn]}
                  onPress={() => setNewVisibility(opt.id)}
                >
                  <View style={[styles.radio, on && styles.radioOn]}>
                    {on ? <View style={styles.radioDot} /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.radioTitle}>{opt.title}</Text>
                    <Text style={styles.radioSub}>{opt.sub}</Text>
                  </View>
                </Pressable>
              );
            })}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.body}>
            {loading ? (
              <Text style={styles.muted}>Loading…</Text>
            ) : (
              collections.map((c) => {
                const on = selected.has(c.id);
                const cover = c.coverImages[0];
                return (
                  <Pressable
                    key={c.id}
                    style={styles.row}
                    onPress={() => toggleId(c.id)}
                  >
                    <View style={styles.thumb}>
                      {cover ? (
                        <Image
                          source={{ uri: cover }}
                          style={styles.thumbImg}
                        />
                      ) : (
                        <Text style={styles.thumbEmoji}>📌</Text>
                      )}
                    </View>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {c.name}
                      </Text>
                      <Text style={styles.rowMeta} numberOfLines={1}>
                        {c.isDefault ? "Default · " : ""}
                        {c.visibility === "public"
                          ? "Public"
                          : "Private"} · {c.itemCount}{" "}
                        {c.itemCount === 1 ? "place" : "places"}
                      </Text>
                    </View>
                    <View style={[styles.check, on && styles.checkOn]}>
                      {on ? <IconCheck size={14} color={colors.white} /> : null}
                    </View>
                  </Pressable>
                );
              })
            )}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>
        )}

        <View style={styles.footer}>
          {creating ? (
            <>
              <Pressable
                onPress={() => setCreating(false)}
                style={styles.secondaryBtn}
              >
                <Text style={styles.secondaryBtnText}>Back</Text>
              </Pressable>
              <Pressable
                onPress={() => void onCreate()}
                style={[
                  styles.primaryBtn,
                  (!newName.trim() || saving) && styles.primaryBtnDisabled,
                ]}
                disabled={!newName.trim() || saving}
              >
                <Text style={styles.primaryBtnText}>
                  {saving ? "Creating…" : "Create"}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                onPress={() => setCreating(true)}
                style={styles.linkBtn}
              >
                <Text style={styles.linkBtnText}>Create collection</Text>
              </Pressable>
              <Pressable
                onPress={() => void onDone()}
                style={[styles.primaryBtn, saving && styles.primaryBtnDisabled]}
                disabled={saving}
              >
                <Text style={styles.primaryBtnText}>
                  {saving ? "Saving…" : "Done"}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: typography.bodySemibold,
    fontSize: 16,
    color: colors.ink,
  },
  body: { padding: 16, gap: 10, paddingBottom: 24 },
  muted: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbImg: { width: "100%", height: "100%" },
  thumbEmoji: { fontSize: 20 },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: {
    fontFamily: typography.bodySemibold,
    fontSize: 15,
    color: colors.ink,
  },
  rowMeta: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 10,
  },
  linkBtn: { alignItems: "center", paddingVertical: 8 },
  linkBtnText: {
    fontFamily: typography.bodySemibold,
    fontSize: 15,
    color: colors.forest,
  },
  primaryBtn: {
    backgroundColor: colors.forest,
    borderRadius: radii.full,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: {
    fontFamily: typography.bodySemibold,
    fontSize: 15,
    color: colors.white,
  },
  secondaryBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  secondaryBtnText: {
    fontFamily: typography.bodyMedium,
    fontSize: 15,
    color: colors.gray,
  },
  label: {
    fontFamily: typography.bodySemibold,
    fontSize: 13,
    color: colors.ink,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.ink,
  },
  radioRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  radioRowOn: {
    borderColor: colors.forest,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  radioOn: { borderColor: colors.forest },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.forest,
  },
  radioTitle: {
    fontFamily: typography.bodySemibold,
    fontSize: 14,
    color: colors.ink,
  },
  radioSub: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
  },
  error: {
    fontFamily: typography.body,
    fontSize: 13,
    color: "#B42318",
    marginTop: 8,
  },
});
