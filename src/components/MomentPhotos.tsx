import { useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { IconX } from "../icons";
import { colors, radii, typography } from "../theme";

const SCREEN_W = Dimensions.get("window").width;
const GRID_GAP = 4;

type MomentPhotosProps = {
  urls: string[];
  /** Indent under feed avatar (feed layout). */
  indent?: number;
};

/**
 * 1 photo: natural aspect (capped height). 2–6: square gallery; tap opens full view.
 */
export function MomentPhotos({ urls, indent = 0 }: MomentPhotosProps) {
  const list = urls.filter(Boolean).slice(0, 6);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [singleAspect, setSingleAspect] = useState(4 / 3);

  if (list.length === 0) return null;

  const maxContentW = SCREEN_W - 40 - indent;

  if (list.length === 1) {
    const aspect = Math.min(Math.max(singleAspect, 0.55), 1.9);
    return (
      <>
        <Pressable
          onPress={() => setViewerIndex(0)}
          style={[styles.singleWrap, indent ? { marginLeft: indent } : null]}
        >
          <Image
            source={{ uri: list[0] }}
            style={[
              styles.singleImage,
              {
                width: maxContentW,
                maxHeight: 320,
                aspectRatio: aspect,
              },
            ]}
            resizeMode="cover"
            onLoad={(e) => {
              const { width, height } = e.nativeEvent.source;
              if (width > 0 && height > 0) setSingleAspect(width / height);
            }}
          />
        </Pressable>
        <PhotoViewer
          urls={list}
          index={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onIndexChange={setViewerIndex}
        />
      </>
    );
  }

  const cols = list.length === 2 || list.length === 4 ? 2 : 3;
  const cell = (maxContentW - GRID_GAP * (cols - 1)) / cols;

  return (
    <>
      <View
        style={[
          styles.grid,
          indent ? { marginLeft: indent } : null,
          { width: maxContentW },
        ]}
      >
        {list.map((uri, i) => (
          <Pressable
            key={`${uri}-${i}`}
            onPress={() => setViewerIndex(i)}
            style={{
              width: cell,
              height: cell,
              marginRight: (i + 1) % cols === 0 ? 0 : GRID_GAP,
              marginBottom: GRID_GAP,
            }}
          >
            <Image
              source={{ uri }}
              style={styles.gridImage}
              resizeMode="cover"
            />
          </Pressable>
        ))}
      </View>
      <PhotoViewer
        urls={list}
        index={viewerIndex}
        onClose={() => setViewerIndex(null)}
        onIndexChange={setViewerIndex}
      />
    </>
  );
}

function PhotoViewer({
  urls,
  index,
  onClose,
  onIndexChange,
}: {
  urls: string[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  if (index == null || index < 0 || index >= urls.length) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.viewer}>
        <Pressable
          style={styles.viewerClose}
          onPress={onClose}
          hitSlop={12}
          accessibilityLabel="Close"
        >
          <IconX size={24} color={colors.white} />
        </Pressable>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: index * SCREEN_W, y: 0 }}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
            if (i >= 0 && i < urls.length) onIndexChange(i);
          }}
        >
          {urls.map((uri) => (
            <View key={uri} style={styles.viewerPage}>
              <Image
                source={{ uri }}
                style={styles.viewerImage}
                resizeMode="contain"
              />
            </View>
          ))}
        </ScrollView>
        {urls.length > 1 ? (
          <Text style={styles.viewerCount}>
            {index + 1} / {urls.length}
          </Text>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  singleWrap: {
    marginTop: 6,
    alignSelf: "flex-start",
    borderRadius: radii.md,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  singleImage: {
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  grid: {
    marginTop: 6,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridImage: {
    width: "100%",
    height: "100%",
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
  },
  viewer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.94)",
    justifyContent: "center",
  },
  viewerClose: {
    position: "absolute",
    top: 56,
    right: 20,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  viewerPage: {
    width: SCREEN_W,
    justifyContent: "center",
    alignItems: "center",
  },
  viewerImage: {
    width: SCREEN_W,
    height: "80%",
  },
  viewerCount: {
    position: "absolute",
    bottom: 48,
    alignSelf: "center",
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: colors.white,
  },
});
