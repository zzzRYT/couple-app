import { useMemo, type ReactNode } from 'react';
import { Image, Text, View } from 'react-native';
import { Canvas, Group, Image as SkiaImage, useImage } from '@shopify/react-native-skia';
import { catalogArt, getAsset, imageForAsset } from './catalog';
import { MascotRoam } from './MascotRoam';
import { placeNodes, type RoomLayout } from './protectedZones';
import type { SceneDocument, SceneObject } from '../lib/client';
import { tokens } from '../theme/tokens';
import { typeStyle } from '../theme/typography';

import { useTranslation } from 'react-i18next';
const textColors = { 'text.primary': tokens.color.sceneText.plateInk, 'text.accent': tokens.color.app.light.normal.primary, 'text.soft': tokens.color.app.light.normal.text2 } as const;
/** Canvas reference width (iPhone 15, 390pt); scene text and plates scale from it. */
const DESIGN_WIDTH = 390;
/**
 * The stored mascot box (0.2 × room width by default) is its placement; the design draws the default mascot in a 170pt scene box
 * on a 390pt room (assets-spec.md), so the drawing scales the stored box by the same ratio and keeps its centre.
 */
export const MASCOT_DRAW_SCALE = 170 / (0.2 * DESIGN_WIDTH);
/** Arched wooden window (canvas room background): sun and cloud by day, moon and star by night. Decorative. */
function RoomWindow({ mode, layout }: { mode: 'day' | 'night'; layout: RoomLayout }) {
  const room = tokens.color.room[mode];
  const width = layout.width * 0.3;
  const height = layout.height * 0.21;
  const frame = Math.max(4, width * 0.07);
  const line = tokens.border.outline.normal;
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', left: layout.width * 0.57, top: layout.height * 0.15, width, height, padding: frame, backgroundColor: room.frame, borderWidth: line, borderColor: room.line, borderTopLeftRadius: width / 2, borderTopRightRadius: width / 2 }}>
      <View style={{ flex: 1, overflow: 'hidden', backgroundColor: room.sky, borderWidth: line, borderColor: room.line, borderTopLeftRadius: width / 2, borderTopRightRadius: width / 2 }}>
        {mode === 'day'
          ? <><View style={{ position: 'absolute', right: '12%', top: '14%', width: width * 0.24, height: width * 0.24, borderRadius: width, backgroundColor: room.sun, borderWidth: line, borderColor: room.line }} />
            <Image source={catalogArt('obj_sky_cloud')} resizeMode="contain" style={{ position: 'absolute', left: '6%', top: '38%', width: width * 0.34, height: width * 0.2, tintColor: '#FFFFFF' }} /></>
          : <><Image source={catalogArt('obj_sky_moon')} resizeMode="contain" style={{ position: 'absolute', right: '10%', top: '12%', width: width * 0.3, height: width * 0.3 }} />
            <Image source={catalogArt('obj_sky_star')} resizeMode="contain" style={{ position: 'absolute', left: '14%', top: '34%', width: width * 0.16, height: width * 0.16 }} /></>}
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: line, backgroundColor: room.line }} />
        <View style={{ position: 'absolute', left: 0, right: 0, top: '58%', height: line, backgroundColor: room.line }} />
      </View>
    </View>
  );
}
function Decoration({ node, mode, layout }: { node: SceneObject; mode: 'day' | 'night'; layout: RoomLayout }) {
  const asset = getAsset(node.assetId);
  const image = useImage(asset ? imageForAsset(asset, mode) : undefined);
  if (!asset || !image) return null;
  const width = node.width * layout.width;
  const height = node.height * layout.height;
  const x = node.x * layout.width - width / 2;
  const y = node.y * layout.height - height / 2;
  return (
    <Group opacity={node.opacity} origin={{ x: x + width / 2, y: y + height / 2 }} transform={[{ rotate: node.rotationDeg * Math.PI / 180 }, { scaleX: node.flipX ? -1 : 1 }]}>
      <SkiaImage image={image} x={x} y={y} width={width} height={height} fit="contain" />
    </Group>
  );
}
/** Fixed renderer for validated scene data. Decorations never take touches or screen-reader focus; native controls passed as children stay on top and accessible. */
export function RoomScene({ scene, mode, layout, compact = false, reducedMotion, paused, celebrating = false, children }: {
  scene: SceneDocument; mode: 'day' | 'night'; layout: RoomLayout; compact?: boolean; reducedMotion?: boolean; paused?: boolean; celebrating?: boolean; children?: ReactNode;
}) {
  const { i18n } = useTranslation();
  const placed = useMemo(() => placeNodes(scene, layout), [scene, layout]);
  const room = tokens.color.room[mode];
  const decorations = placed.objects.filter((node) => node.assetId !== 'app_mascot').sort((a, b) => a.zIndex - b.zIndex);
  const mascot = placed.objects.find((node) => node.assetId === 'app_mascot');
  // Scene text never drops below the 20pt minimum in the full-size room; miniatures scale with the room.
  const unit = compact ? layout.width / DESIGN_WIDTH : Math.max(1, layout.width / DESIGN_WIDTH);
  const sceneTextStyle = typeStyle('heading', i18n.language);
  const mascotSize = mascot ? Math.min(mascot.width * layout.width, mascot.height * layout.height) * MASCOT_DRAW_SCALE : 0;
  return (
    <View testID="room-scene" style={{ width: layout.width, height: layout.height, backgroundColor: room.wall, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: layout.height * (1 - tokens.layout.floorLineRatio), backgroundColor: room.floor, borderTopWidth: tokens.border.outline.normal, borderColor: room.line }} />
      <RoomWindow mode={mode} layout={layout} />
      <View testID="room-decor" pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', left: 0, top: 0, width: layout.width, height: layout.height }}>
        <Canvas style={{ width: layout.width, height: layout.height }}>
          {decorations.map((node, index) => <Decoration key={`${node.assetId}-${index}`} node={node} mode={mode} layout={layout} />)}
        </Canvas>
        {placed.texts.map((node, index) => (
          <View key={index} style={{ position: 'absolute', left: (node.x - node.width / 2) * layout.width, top: (node.y - node.height / 2) * layout.height, minWidth: node.width * layout.width, minHeight: node.height * layout.height, paddingHorizontal: 12 * unit, paddingVertical: 4 * unit, transform: [{ rotate: `${node.rotationDeg}deg` }], zIndex: node.zIndex, backgroundColor: tokens.color.sceneText.plateFill, borderWidth: tokens.border.outline.normal, borderColor: tokens.color.sceneText.outline, borderRadius: 16 * unit, justifyContent: 'center', alignItems: 'center' }}>
            <Text numberOfLines={2} style={[sceneTextStyle, { color: textColors[node.styleToken], fontSize: tokens.layout.sceneTextMinSizePt * unit, lineHeight: tokens.layout.sceneTextMinSizePt * unit * 1.25, textAlign: 'center' }]}>{node.text}</Text>
          </View>
        ))}
      </View>
      {mascot && (
        <View style={{ position: 'absolute', left: mascot.x * layout.width - mascotSize / 2, top: mascot.y * layout.height - mascotSize / 2, zIndex: mascot.zIndex }}>
          <MascotRoam size={mascotSize} roamWidth={compact ? 0 : layout.width} compact={compact} reducedMotion={reducedMotion} paused={paused} celebrating={celebrating} />
        </View>
      )}
      {children}
    </View>
  );
}
