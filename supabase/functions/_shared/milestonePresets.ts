import { validateCandidate, type Candidate } from './sceneValidate.ts';

type RoomObject = { assetId: string; x: number; y: number; width: number; height: number; rotationDeg: number; zIndex: number; opacity: number };
type Scene = { schemaVersion: 1; canvasProfile: 'room-portrait-v1'; objects: RoomObject[]; texts: { text: string; x: number; y: number; width: number; height: number; rotationDeg: number; zIndex: number; styleToken: 'text.primary' | 'text.accent' | 'text.soft' }[] };
type PresetInput = { scene: Scene; roomPresentation: Record<string, unknown>; roomThemeDocument: Record<string, unknown>; key: string; kind: 'day' | 'anniversary'; days: number | null; anniversaryN: number | null; locale: string; activeAssetIds: string[] };
const slots: RoomObject[] = [
  { assetId: 'obj_party_cake', x: 0.27, y: 0.43, width: 0.12, height: 0.13, rotationDeg: 0, zIndex: 15, opacity: 1 },
  { assetId: 'obj_party_ribbon', x: 0.73, y: 0.43, width: 0.13, height: 0.13, rotationDeg: 0, zIndex: 16, opacity: 1 },
  { assetId: 'obj_party_balloon', x: 0.13, y: 0.28, width: 0.11, height: 0.13, rotationDeg: 0, zIndex: 17, opacity: 1 },
  { assetId: 'obj_shape_sparkle', x: 0.82, y: 0.30, width: 0.09, height: 0.10, rotationDeg: 0, zIndex: 18, opacity: 1 },
  { assetId: 'obj_shape_sparkle', x: 0.34, y: 0.27, width: 0.08, height: 0.09, rotationDeg: 0, zIndex: 19, opacity: 1 },
  { assetId: 'obj_keep_gift', x: 0.68, y: 0.28, width: 0.12, height: 0.13, rotationDeg: 0, zIndex: 20, opacity: 1 },
];
const localeText = (kind: 'day' | 'anniversary', n: number, locale: string) => {
  if (locale === 'ko-KR') return kind === 'day' ? `우리 ${n}일` : `우리 ${n}주년`;
  if (locale === 'ja-JP') return kind === 'day' ? `ふたりの${n}日` : `ふたりの${n}周年`;
  return kind === 'day' ? `Our day ${n}` : `Our ${n} anniversary`;
};
function overlaps(a: RoomObject, b: RoomObject): boolean {
  return Math.abs(a.x - b.x) < (a.width + b.width) / 2 && Math.abs(a.y - b.y) < (a.height + b.height) / 2;
}

/** Static, AI-free preset. It preserves the current theme and only adds catalog objects. */
export function buildMilestonePreset(input: PresetInput): { candidate: Candidate; placed: number; requested: number } {
  const requested = input.kind === 'anniversary' ? 6 : 5;
  const requestedSlots = input.kind === 'anniversary' ? slots : slots.slice(0, 5);
  const objects = [...input.scene.objects];
  const available: RoomObject[] = [];
  for (const slot of requestedSlots) {
    if (objects.length + available.length >= 16) break;
    if (!input.activeAssetIds.includes(slot.assetId)) continue;
    if ([...objects, ...available].some((placed) => overlaps(slot, placed))) continue;
    const trial: Candidate = { sceneDocument: { ...input.scene, objects: [...objects, ...available, slot] }, roomPresentation: input.roomPresentation, roomThemeDocument: input.roomThemeDocument };
    if (!validateCandidate(trial, input.activeAssetIds).ok) continue;
    available.push(slot);
  }
  if (!available.length) throw new Error('ROOM_FULL');
  const text = input.scene.texts.length < 3 ? [{ text: localeText(input.kind, input.kind === 'day' ? input.days ?? 0 : input.anniversaryN ?? 0, input.locale),
    x: 0.5, y: 0.22, width: 0.62, height: 0.06, rotationDeg: 0, zIndex: 21, styleToken: 'text.accent' as const }] : [];
  const candidate: Candidate = {
    sceneDocument: { ...input.scene, objects: [...objects, ...available], texts: [...input.scene.texts, ...text] },
    roomPresentation: input.roomPresentation,
    roomThemeDocument: input.roomThemeDocument,
  };
  const validation = validateCandidate(candidate, input.activeAssetIds);
  if (!validation.ok) throw new Error('INVALID_CANDIDATE');
  return { candidate, placed: available.length, requested };
}
