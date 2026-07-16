import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors, radii, typography } from "../theme";

type SearchBarProps = {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  editable?: boolean;
  autoFocus?: boolean;
};

export function SearchBar({
  placeholder = "Search communities, dishes…",
  value,
  onChangeText,
  onPress,
  editable = true,
  autoFocus = false,
}: SearchBarProps) {
  if (onPress && !editable) {
    return (
      <Pressable onPress={onPress} style={styles.container}>
        <Feather name="search" size={18} color={colors.gray} />
        <Text style={styles.placeholder}>{placeholder}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <Feather name="search" size={18} color={colors.gray} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.grayLight}
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        returnKeyType="search"
        clearButtonMode="never"
      />
      {value && onChangeText ? (
        <Pressable
          onPress={() => onChangeText("")}
          hitSlop={8}
          accessibilityLabel="Clear search"
        >
          <Feather name="x" size={18} color={colors.grayLight} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.ink,
    padding: 0,
  },
  placeholder: {
    flex: 1,
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.grayLight,
  },
});
