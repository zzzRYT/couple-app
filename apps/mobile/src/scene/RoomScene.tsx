import { useMemo, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Canvas, Group, Image as SkiaImage, useImage } from '@shopify/react-native-skia';
import { getAsset, imageForAsset } from './catalog';
import { MascotRoam } from './MascotRoam';
import { placeNodes, type RoomLayout } from './protectedZones';
import type { SceneDocument, SceneObject } from '../lib/client';
import { tokens } from '../theme/tokens';
const textColors = { 'text.primary': tokens.color.sceneText.plateInk, 'text.accent': tokens.color.app.light.normal.primary, 'text.soft': tokens.color.app.light.normal.text2 } as const;
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
export function RoomScene({ scene, mode, layout, compact = false, reducedMotion, paused, children }: {
  scene: SceneDocument; mode: 'day' | 'night'; layout: RoomLayout; compact?: boolean; reducedMotion?: boolean; paused?: boolean; children?: ReactNode;
}) {
  const placed = useMemo(() => placeNodes(scene, layout), [scene, layout]);
  const room = tokens.color.room[mode];
  const decorations = placed.objects.filter((node) => node.assetId !== 'app_mascot').sort((a, b) => a.zIndex - b.zIndex);
  const mascot = placed.objects.find((node) => node.assetId === 'app_mascot');
  return (
    <View testID="room-scene" style={{ width: layout.width, height: layout.height, backgroundColor: room.wall, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: layout.height * (1 - tokens.layout.floorLineRatio), backgroundColor: room.floor }} />
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', left: layout.width * 0.58, top: layout.height * 0.16, width: layout.width * 0.28, height: layout.height * 0.20, borderWidth: tokens.border.outline.normal, borderColor: room.line, borderTopLeftRadius: layout.width * 0.14, borderTopRightRadius: layout.width * 0.14, overflow: 'hidden', backgroundColor: room.sky }}>
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: tokens.border.outline.normal, backgroundColor: room.line }} />
        <View style={{ position: 'absolute', left: 0, right: 0, top: '60%', height: tokens.border.outline.normal, backgroundColor: room.line }} />
      </View>
      <View testID="room-decor" pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', left: 0, top: 0, width: layout.width, height: layout.height }}>
        <Canvas style={{ width: layout.width, height: layout.height }}>
          {decorations.map((node, index) => <Decoration key={`${node.assetId}-${index}`} node={node} mode={mode} layout={layout} />)}
        </Canvas>
        {placed.texts.map((node, index) => (
          <View key={index} style={{ position: 'absolute', left: (node.x - node.width / 2) * layout.width, top: (node.y - node.height / 2) * layout.height, width: node.width * layout.width, height: node.height * layout.height, transform: [{ rotate: `${node.rotationDeg}deg` }], zIndex: node.zIndex, backgroundColor: tokens.color.sceneText.plateFill, borderWidth: 2, borderColor: tokens.color.sceneText.outline, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: textColors[node.styleToken] }}>{node.text}</Text>
          </View>
        ))}
      </View>
      {mascot && (
        <View style={{ position: 'absolute', left: (mascot.x - mascot.width / 2) * layout.width, top: (mascot.y - mascot.height / 2) * layout.height, zIndex: mascot.zIndex }}>
          <MascotRoam size={Math.min(mascot.width * layout.width, mascot.height * layout.height)} roamWidth={compact ? 0 : layout.width} compact={compact} reducedMotion={reducedMotion} paused={paused} />
        </View>
      )}
      {children}
    </View>
  );
}
