import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
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
  listFollowingCollections,
  listMyCollections,
  type ApiCollectionSummary,
} from "../api/collections";
import { IconBookmark, IconPlus } from "../icons";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, typography } from "../theme";

export function CollectionsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [mine, setMine] = useState<ApiCollectionSummary[]>([]);
  const [following, setFollowing] = useState<ApiCollectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, f] = await Promise.all([
        listMyCollections().catch(() => [] as ApiCollectionSummary[]),
        listFollowingCollections().catch(() => [] as ApiCollectionSummary[]),
      ]);
      setMine(m);
      setFollowing(f);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const openCollection = (id: string) => {
    navigation.navigate("CollectionDetail", { collectionId: id });
  };

  const renderCard = (c: ApiCollectionSummary, showOwner?: boolean) => {
    const cover = c.coverImages[0];
    return (
      <Pressable
        key={c.id}
        style={styles.card}
        onPress={() => openCollection(c.id)}
      >
        <View style={styles.cover}>
          {cover ? (
            <Image source={{ uri: cover }} style={styles.coverImg} />
          ) : (
            <IconBookmark size={28} color={colors.grayLight} />
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {c.name}
          </Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {showOwner && c.owner
              ? `By ${c.owner.displayName} · `
              : c.isDefault
                ? "Default · "
                : ""}
            {c.visibility === "public" ? "Public" : "Private"} · {c.itemCount}{" "}
            {c.itemCount === 1 ? "place" : "places"}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Collections</Text>
        <Pressable
          onPress={() => setCreating(true)}
          style={styles.addBtn}
          accessibilityLabel="Create collection"
        >
          <IconPlus size={20} color={colors.white} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Text style={styles.muted}>Loading…</Text>
        ) : (
          <>
            <Text style={styles.section}>Yours</Text>
            {mine.length === 0 ? (
              <Text style={styles.muted}>
                Save places and dishes. They will land in Saved.
              </Text>
            ) : (
              mine.map((c) => renderCard(c))
            )}

            {following.length > 0 ? (
              <>
                <Text style={[styles.section, styles.sectionSpaced]}>
                  Following
                </Text>
                {following.map((c) => renderCard(c, true))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      <CreateCollectionModal
        visible={creating}
        onClose={() => setCreating(false)}
        onCreated={(id) => {
          setCreating(false);
          void load();
          openCollection(id);
        }}
      />
    </SafeAreaView>
  );
}

function CreateCollectionModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.createHeader}>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.createTitle}>New collection</Text>
          <View style={{ width: 52 }} />
        </View>
        <View style={styles.createBody}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Collection name"
            placeholderTextColor={colors.grayLight}
            autoFocus
          />
          <Text style={styles.label}>Privacy</Text>
          {(
            [
              { id: "private" as const, t: "Private", s: "Only you" },
              { id: "public" as const, t: "Public", s: "Anyone can follow" },
            ] as const
          ).map((opt) => (
            <Pressable
              key={opt.id}
              style={[
                styles.radioRow,
                visibility === opt.id && styles.radioRowOn,
              ]}
              onPress={() => setVisibility(opt.id)}
            >
              <Text style={styles.rowTitle}>
                {opt.t}
                <Text style={styles.cardMeta}> · {opt.s}</Text>
              </Text>
            </Pressable>
          ))}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            style={[
              styles.createBtn,
              (!name.trim() || busy) && { opacity: 0.5 },
            ]}
            disabled={!name.trim() || busy}
            onPress={async () => {
              setBusy(true);
              setError(null);
              try {
                const c = await createCollection({
                  name: name.trim(),
                  visibility,
                });
                setName("");
                onCreated(c.id);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Failed");
              } finally {
                setBusy(false);
              }
            }}
          >
            <Text style={styles.createBtnText}>
              {busy ? "Creating…" : "Create"}
            </Text>
          </Pressable>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontFamily: typography.display,
    fontSize: 28,
    color: colors.ink,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  section: {
    fontFamily: typography.bodySemibold,
    fontSize: 12,
    color: colors.gray,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  sectionSpaced: { marginTop: 28 },
  muted: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
    lineHeight: 20,
  },
  card: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  cover: {
    width: 56,
    height: 56,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  coverImg: { width: "100%", height: "100%" },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: {
    fontFamily: typography.bodySemibold,
    fontSize: 16,
    color: colors.ink,
  },
  cardMeta: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
  },
  createHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cancel: {
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.gray,
  },
  createTitle: {
    fontFamily: typography.bodySemibold,
    fontSize: 16,
    color: colors.ink,
  },
  createBody: { padding: 20, gap: 10 },
  label: {
    fontFamily: typography.bodySemibold,
    fontSize: 13,
    color: colors.ink,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 12,
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  radioRow: {
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  radioRowOn: { borderColor: colors.forest },
  rowTitle: {
    fontFamily: typography.bodySemibold,
    fontSize: 14,
    color: colors.ink,
  },
  createBtn: {
    marginTop: 12,
    backgroundColor: colors.forest,
    borderRadius: radii.full,
    paddingVertical: 14,
    alignItems: "center",
  },
  createBtnText: {
    fontFamily: typography.bodySemibold,
    fontSize: 15,
    color: colors.white,
  },
  error: {
    fontFamily: typography.body,
    fontSize: 13,
    color: "#B42318",
  },
});
