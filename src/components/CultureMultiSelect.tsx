import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ONBOARDING_CULTURES, type CultureOption } from "../data/userPrefs";
import {
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconX,
} from "../icons";
import { colors, radii, typography } from "../theme";
import { CircularFlag } from "./CircularFlag";

const MAX_CULTURES = 2;

type CultureMultiSelectProps = {
  value: string[];
  onChange: (next: string[]) => void;
  /** Optional shorter placeholder for tight layouts */
  placeholder?: string;
};

export function CultureMultiSelect({
  value,
  onChange,
  placeholder = "Search and choose up to two",
}: CultureMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(() => {
    return value
      .map((id) => ONBOARDING_CULTURES.find((c) => c.id === id))
      .filter((c): c is CultureOption => !!c);
  }, [value]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ONBOARDING_CULTURES;
    return ONBOARDING_CULTURES.filter(
      (c) => c.label.toLowerCase().includes(q) || c.id.includes(q),
    );
  }, [query]);

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((c) => c !== id));
      return;
    }
    if (value.length >= MAX_CULTURES) return;
    onChange([...value, id]);
  };

  const remove = (id: string) => {
    onChange(value.filter((c) => c !== id));
  };

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <View>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          pressed && styles.triggerPressed,
        ]}
      >
        {selected.length === 0 ? (
          <Text style={styles.placeholder}>{placeholder}</Text>
        ) : (
          <View style={styles.selectedRow}>
            {selected.map((culture) => (
              <Pressable
                key={culture.id}
                onPress={(e) => {
                  e.stopPropagation?.();
                  remove(culture.id);
                }}
                style={styles.selectedPill}
                hitSlop={4}
              >
                <CircularFlag
                  countryCode={culture.countryCode}
                  flag={culture.flag}
                  size={20}
                />
                <Text style={styles.selectedPillLabel}>{culture.label}</Text>
                <IconX size={14} color={colors.gray} />
              </Pressable>
            ))}
          </View>
        )}
        {open ? (
          <IconChevronUp size={20} color={colors.gray} />
        ) : (
          <IconChevronDown size={20} color={colors.gray} />
        )}
      </Pressable>
      <Text style={styles.helper}>
        {value.length}/{MAX_CULTURES} selected
      </Text>

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={close}
      >
        <SafeAreaView style={styles.sheet} edges={["top", "bottom"]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Choose a place</Text>
            <Pressable onPress={close} hitSlop={8}>
              <Text style={styles.done}>Done</Text>
            </Pressable>
          </View>

          <View style={styles.searchWrap}>
            <IconSearch size={16} color={colors.gray} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name"
              placeholderTextColor={colors.grayLight}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>

          {selected.length > 0 ? (
            <View style={styles.sheetSelected}>
              {selected.map((culture) => (
                <Pressable
                  key={culture.id}
                  onPress={() => remove(culture.id)}
                  style={styles.selectedPill}
                >
                  <CircularFlag
                    countryCode={culture.countryCode}
                    flag={culture.flag}
                    size={20}
                  />
                  <Text style={styles.selectedPillLabel}>{culture.label}</Text>
                  <IconX size={14} color={colors.gray} />
                </Pressable>
              ))}
            </View>
          ) : null}

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.list}
          >
            {filtered.map((culture) => {
              const isSelected = value.includes(culture.id);
              const atMax = value.length >= MAX_CULTURES && !isSelected;
              return (
                <Pressable
                  key={culture.id}
                  onPress={() => toggle(culture.id)}
                  disabled={atMax}
                  style={[styles.row, atMax && styles.rowDisabled]}
                >
                  <CircularFlag
                    countryCode={culture.countryCode}
                    flag={culture.flag}
                    size={28}
                    selected={isSelected}
                  />
                  <Text style={styles.rowLabel}>{culture.label}</Text>
                  <View
                    style={[styles.check, isSelected && styles.checkSelected]}
                  >
                    {isSelected ? (
                      <IconCheck size={14} color={colors.white} />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
            {filtered.length === 0 ? (
              <Text style={styles.empty}>Nothing matched that search.</Text>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  triggerPressed: {
    opacity: 0.92,
  },
  placeholder: {
    flex: 1,
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.gray,
  },
  selectedRow: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedPillLabel: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.ink,
  },
  helper: {
    marginTop: 8,
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.gray,
    textAlign: "right",
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    fontFamily: typography.bodySemibold,
    fontSize: 17,
    color: colors.ink,
  },
  done: {
    fontFamily: typography.bodyMedium,
    fontSize: 15,
    color: colors.forest,
  },
  searchWrap: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.ink,
    padding: 0,
  },
  sheetSelected: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  list: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowDisabled: {
    opacity: 0.35,
  },
  rowLabel: {
    flex: 1,
    fontFamily: typography.bodyMedium,
    fontSize: 15,
    color: colors.ink,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkSelected: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  empty: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
    textAlign: "center",
    marginTop: 24,
  },
});
