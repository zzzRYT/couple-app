export type ThemeTokens = { ground: [string, string, string]; cap: [string, string]; detail: string; sky: [string, string] };
const theme = (ground: ThemeTokens['ground'], cap: ThemeTokens['cap'], sky: ThemeTokens['sky'], detail = ground[2]): ThemeTokens => ({ ground, cap, detail, sky });
export const themes = {
  potato: theme(['#F6DDB8', '#E3BC90', '#B98A63'], ['#A8C6A0', '#8FB68A'], ['#CFE3F2', '#FBEBD8'], '#C39772'),
  strawberry: theme(['#F7B9C3', '#E88A9B', '#BD5F73'], ['#A8C6A0', '#8FB68A'], ['#FBE3E6', '#FFF4DF']),
  cherry: theme(['#FBE4E9', '#F2BFCB', '#D495A6'], ['#F2A7B4', '#E88A9B'], ['#E6F0F7', '#FCE9EC']),
  sea: theme(['#C4DDEE', '#8DB6D2', '#5F8BAA'], ['#F7E3B5', '#E3C78C'], ['#D6ECF2', '#F3F8F4']),
  desert: theme(['#FBE6AE', '#EBC272', '#C4974D'], ['#D98B63', '#B96F4B'], ['#FBE3C4', '#FFF4DF']),
  winter: theme(['#FFFFFF', '#DCE8F0', '#A9BFCE'], ['#FFFFFF', '#D5E3EC'], ['#C9DCEA', '#F1F6FA']),
  starlight: theme(['#8F86C9', '#5F5798', '#3B3468'], ['#C9B8E8', '#A692D4'], ['#1E1B3A', '#3A3260']),
} as const;
export type Camera = { yaw: number; pitch: number; zoom: number };
export type PlanetScene = { theme: ThemeTokens; timeOfDay: 'day' | 'night'; camera: Camera };
export function potatoRadius(x: number, y: number, z: number): number {
  return 1 + 0.035 * Math.sin(x * 5 + z * 3) * Math.sin(y * 5 - z * 2);
}
export function surfacePosition(latitude: number, longitude: number): [number, number, number] {
  const lat = latitude * Math.PI / 180; const lon = longitude * Math.PI / 180;
  const x = Math.cos(lat) * Math.sin(lon); const y = Math.sin(lat); const z = Math.cos(lat) * Math.cos(lon);
  const radius = potatoRadius(x, y, z);
  return [x * radius, y * radius * 0.94, z * radius * 0.96];
}
export const initialCamera: Camera = { yaw: 0, pitch: 0, zoom: 1 };
export function drag(camera: Camera, dx: number, dy: number): Camera {
  return { ...camera, yaw: camera.yaw + dx * 0.01, pitch: Math.max(-0.7, Math.min(0.7, camera.pitch + dy * 0.01)) };
}
export function face(camera: Camera, latitude: number, longitude: number): Camera {
  return { ...camera, yaw: -longitude * Math.PI / 180, pitch: Math.max(-0.7, Math.min(0.7, latitude * Math.PI / 180)) };
}
export function pinch(camera: Camera, ratio: number): Camera {
  return { ...camera, zoom: Math.max(1, Math.min(2.2, camera.zoom * ratio)) };
}
export function inertia(velocity: number, elapsed: number, reducedMotion: boolean): number {
  return reducedMotion ? 0 : velocity * Math.max(0, 1 - elapsed / 600);
}
