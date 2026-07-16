import { useEffect, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

import { getCommunityFlag } from "../data/communityFlags";
import { colors, typography } from "../theme";
import type { Community } from "../types";
import { CircularFlag } from "./CircularFlag";

type CommunityMapProps = {
  communities: Community[];
  style?: StyleProp<ViewStyle>;
  interactive?: boolean;
  onMarkerPress?: (communityId: string) => void;
  /** Force remount when filters change so markers actually update */
  filterKey?: string;
  selectedId?: string | null;
};

/**
 * Shared map surface. MapView must be an in-flow child with flex/size —
 * absoluteFill inside a flex-only parent collapses to height 0.
 */
export function CommunityMap({
  communities,
  style,
  interactive = true,
  onMarkerPress,
  filterKey = "all",
  selectedId = null,
}: CommunityMapProps) {
  if (Platform.OS === "web") {
    return <MapFallback communities={communities} style={style} />;
  }

  return (
    <MapView
      key={filterKey}
      style={[styles.map, style]}
      provider={PROVIDER_DEFAULT}
      initialRegion={{
        latitude: 40.72,
        longitude: -73.95,
        latitudeDelta: 0.28,
        longitudeDelta: 0.28,
      }}
      scrollEnabled={interactive}
      zoomEnabled={interactive}
      rotateEnabled={interactive}
      pitchEnabled={interactive}
      toolbarEnabled={false}
      loadingEnabled
      loadingIndicatorColor={colors.forest}
      loadingBackgroundColor={colors.surface}
    >
      {communities.map((c) => (
        <FlagMarker
          key={`${filterKey}-${c.id}`}
          community={c}
          selected={c.id === selectedId}
          onPress={onMarkerPress}
        />
      ))}
    </MapView>
  );
}

function FlagMarker({
  community,
  selected,
  onPress,
}: {
  community: Community;
  selected: boolean;
  onPress?: (communityId: string) => void;
}) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const flag = getCommunityFlag(community.id, community.emoji);

  useEffect(() => {
    setTracksViewChanges(true);
    const id = setTimeout(() => setTracksViewChanges(false), 450);
    return () => clearTimeout(id);
  }, [flag, selected]);

  return (
    <Marker
      identifier={community.id}
      coordinate={{
        latitude: community.latitude,
        longitude: community.longitude,
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
      onPress={onPress ? () => onPress(community.id) : undefined}
    >
      <View style={styles.markerWrap} collapsable={false}>
        <CircularFlag
          flag={flag}
          size={selected ? 48 : 40}
          selected={selected}
          elevated
        />
      </View>
    </Marker>
  );
}

function MapFallback({
  communities,
  style,
}: {
  communities: Community[];
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.fallback, style]}>
      <Text style={styles.fallbackLabel}>Map preview</Text>
      <Text style={styles.fallbackSub}>
        {communities.length} enclaves around NYC
      </Text>
      <View style={styles.pinRow}>
        {communities.slice(0, 6).map((c) => (
          <CircularFlag
            key={c.id}
            flag={getCommunityFlag(c.id, c.emoji)}
            size={36}
            elevated
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: "100%",
  },
  markerWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  fallback: {
    flex: 1,
    width: "100%",
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  fallbackLabel: {
    fontFamily: typography.display,
    fontSize: 20,
    color: colors.white,
  },
  fallbackSub: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.grayLight,
    marginTop: 6,
  },
  pinRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 16,
  },
});
