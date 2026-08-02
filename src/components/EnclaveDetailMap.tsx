import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

import type { GeoJsonPoint, LatLng } from "../api/geo";
import { pointToLatLng } from "../api/geo";
import {
  primaryEthnicityCountryCode,
  primaryEthnicityEmoji,
} from "../data/ethnicityFlags";
import { colors, radii, typography } from "../theme";
import { MapFlagPin } from "./MapFlagPin";

type EnclavePoi = {
  id: string;
  name: string;
  location?: GeoJsonPoint | null;
  ethnicities?: string[];
};

type EnclaveDetailMapProps = {
  centroid?: LatLng | null;
  pois: EnclavePoi[];
  onPoiPress?: (poiId: string) => void;
  style?: StyleProp<ViewStyle>;
  /** Override default map height (useful in compact sheets). */
  height?: number;
};

const MAP_HEIGHT = 240;
const PIN_SIZE = 28;

export function EnclaveDetailMap({
  centroid,
  pois,
  onPoiPress,
  style,
  height = MAP_HEIGHT,
}: EnclaveDetailMapProps) {
  const mapRef = useRef<MapView>(null);
  const mapReady = useRef(false);
  const lastFitKey = useRef("");

  const markers = useMemo(() => {
    const out: {
      id: string;
      name: string;
      coordinate: LatLng;
      countryCode?: string;
      emoji: string;
    }[] = [];
    for (const poi of pois) {
      const coordinate = pointToLatLng(poi.location);
      if (!coordinate) continue;
      out.push({
        id: poi.id,
        name: poi.name,
        coordinate,
        countryCode: primaryEthnicityCountryCode(poi.ethnicities),
        emoji: primaryEthnicityEmoji(poi.ethnicities),
      });
    }
    return out;
  }, [pois]);

  const fitCoords = useMemo(() => {
    if (markers.length > 0) return markers.map((m) => m.coordinate);
    if (
      centroid &&
      Number.isFinite(centroid.latitude) &&
      Number.isFinite(centroid.longitude)
    ) {
      return [centroid];
    }
    return [];
  }, [markers, centroid]);

  const fitKey = useMemo(
    () =>
      fitCoords
        .map((c) => `${c.latitude.toFixed(5)},${c.longitude.toFixed(5)}`)
        .join("|"),
    [fitCoords],
  );

  const hasMapContent = fitCoords.length > 0;

  const fitMap = useCallback(
    (animated: boolean) => {
      if (fitCoords.length === 0 || !mapReady.current) return;
      if (lastFitKey.current === fitKey) return;
      lastFitKey.current = fitKey;
      const pad = Math.max(24, Math.round(height * 0.12));
      requestAnimationFrame(() => {
        mapRef.current?.fitToCoordinates(fitCoords, {
          edgePadding: { top: pad, right: pad, bottom: pad, left: pad },
          animated,
        });
      });
    },
    [fitCoords, fitKey, height],
  );

  useEffect(() => {
    fitMap(false);
  }, [fitMap]);

  if (!hasMapContent) {
    return null;
  }

  if (Platform.OS === "web") {
    return (
      <View style={[styles.fallback, { height }, style]}>
        <Text style={styles.fallbackTitle}>Enclave map</Text>
        <Text style={styles.fallbackSub}>
          {markers.length > 0
            ? `${markers.length} places in this area`
            : "Map available on device"}
        </Text>
      </View>
    );
  }

  const initial = fitCoords[0]!;

  return (
    <View style={[styles.wrap, { height }, style]} collapsable={false}>
      <MapView
        ref={mapRef}
        style={[styles.map, { height }]}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: initial.latitude,
          longitude: initial.longitude,
          latitudeDelta: 0.045,
          longitudeDelta: 0.045,
        }}
        onMapReady={() => {
          mapReady.current = true;
          // Allow a fresh fit after the native map is ready.
          lastFitKey.current = "";
          fitMap(false);
        }}
        scrollEnabled
        zoomEnabled
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        loadingEnabled={false}
        moveOnMarkerPress={false}
      >
        {markers.map((m) => (
          <RestaurantFlagMarker
            key={m.id}
            id={m.id}
            name={m.name}
            coordinate={m.coordinate}
            countryCode={m.countryCode}
            emoji={m.emoji}
            onPress={onPoiPress}
          />
        ))}
      </MapView>
    </View>
  );
}

function RestaurantFlagMarker({
  id,
  name,
  coordinate,
  countryCode,
  emoji,
  onPress,
}: {
  id: string;
  name: string;
  coordinate: LatLng;
  countryCode?: string;
  emoji: string;
  onPress?: (poiId: string) => void;
}) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);
    const t = setTimeout(() => setTracksViewChanges(false), 900);
    return () => clearTimeout(t);
  }, [countryCode, emoji]);

  return (
    <Marker
      identifier={id}
      coordinate={coordinate}
      title={name}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={tracksViewChanges}
      onPress={(e) => {
        e.stopPropagation?.();
        onPress?.(id);
      }}
    >
      <View style={styles.markerWrap} collapsable={false} pointerEvents="none">
        <MapFlagPin countryCode={countryCode} flag={emoji} size={PIN_SIZE} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: MAP_HEIGHT,
    width: "100%",
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: MAP_HEIGHT,
    borderRadius: radii.lg,
  },
  markerWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  fallback: {
    height: MAP_HEIGHT,
    borderRadius: radii.lg,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  fallbackTitle: {
    fontFamily: typography.display,
    fontSize: 18,
    color: colors.white,
  },
  fallbackSub: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.grayLight,
    marginTop: 6,
    textAlign: "center",
  },
});
