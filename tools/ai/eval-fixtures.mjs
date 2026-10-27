// Run with Deno: `deno run -A tools/ai/eval-fixtures.mjs`. Without ANTHROPIC_API_KEY it uses a deterministic mock (no network);
// with a key it calls the real server wrapper. Escalation rules are decided from real runs at G8, not from mock output.
import { anthropicModel } from '../../supabase/functions/_shared/anthropic.ts';
import { validateCandidate } from '../../supabase/functions/_shared/sceneValidate.ts';

const fixtures = JSON.parse(await Deno.readTextFile(new URL('../../supabase/functions/decoration-previews/__fixtures__/prompts.json', import.meta.url)));
const manifest = JSON.parse(await Deno.readTextFile(new URL('../../assets/catalog/manifest.json', import.meta.url)));
const catalog = manifest.filter((e) => e.asset_kind === 'room_object' && e.status === 'active').map((e) => ({ assetId: e.asset_id, description: e.asset_id.replace(/^obj_/, '').replaceAll('_', ' ') }));
const mascot = { assetId: 'app_mascot', x: 0.5, y: 0.72, width: 0.2, height: 0.2, rotationDeg: 0, zIndex: 1, opacity: 1 };
const presentation = { visible: true, x: 0.5, y: 0.17, width: 0.84, height: 0.14, styleToken: 'day.default', textScale: 1 };
const theme = { schemaVersion: 1, mode: 'follow_time', timeZone: 'Asia/Seoul', day: { backgroundToken: 'room.day', paletteToken: 'room.day', assetVariants: [] }, night: { backgroundToken: 'room.night', paletteToken: 'room.night', assetVariants: [] } };
const words = { star: 'obj_sky_star', '별': 'obj_sky_star', book: 'obj_decor_books', '책': 'obj_decor_books', '화분': 'obj_plant_flowerpot', '풍선': 'obj_party_balloon', '케이크': 'obj_party_cake',
  '달': 'obj_sky_moon', '구름': 'obj_sky_cloud', letter: 'obj_keep_letter', mug: 'obj_keep_mug', sparkle: 'obj_shape_sparkle', dot: 'obj_shape_dots', 'ランプ': 'obj_decor_lamp', 'クッション': 'obj_decor_cushion', 'プレゼント': 'obj_keep_gift', 'リボン': 'obj_party_ribbon' };
const mockModel = {
  propose(input) {
    if (/logo|brand|cartoon/i.test(input.prompt)) return Promise.resolve({ model: 'mock', proposal: { decision: 'unsupported', objects: [], texts: [], presentation } });
    const ids = [...new Set(Object.entries(words).filter(([w]) => input.prompt.toLowerCase().includes(w)).map(([, id]) => id))];
    const objects = [mascot, ...ids.map((assetId, i) => ({ ...mascot, assetId, x: 0.2 + i * 0.3, y: 0.42, width: 0.12, height: 0.12, zIndex: 2 + i }))];
    const quoted = input.prompt.match(/'([^']{1,40})'/)?.[1];
    const texts = quoted ? [{ text: quoted, x: 0.5, y: 0.3, width: 0.6, height: 0.06, rotationDeg: 0, zIndex: 5, styleToken: 'text.primary' }] : [];
    return Promise.resolve({ model: 'mock', proposal: { decision: 'propose', objects, texts, presentation } });
  },
};
const real = Boolean(Deno.env.get('ANTHROPIC_API_KEY'));
const model = real ? anthropicModel() : mockModel;
const rows = [];
for (const f of fixtures.prompts) {
  const input = { prompt: f.prompt, scene: { objects: [mascot], texts: [] }, presentation, catalog: [{ assetId: 'app_mascot', description: 'fixed app mascot' }, ...catalog],
    presentationStyleTokens: ['day.default', 'day.card', 'day.minimal', 'day.accent', 'night.default', 'night.card', 'night.minimal', 'night.accent'], textStyleTokens: ['text.primary', 'text.accent', 'text.soft'], rules: [] };
  let row;
  try {
    const { proposal, model: used } = await model.propose(input, { escalate: false });
    const candidate = { sceneDocument: { schemaVersion: 1, canvasProfile: 'room-portrait-v1', objects: proposal.objects, texts: proposal.texts }, roomPresentation: { schemaVersion: 1, ...proposal.presentation }, roomThemeDocument: theme };
    const valid = proposal.decision !== 'propose' || validateCandidate(candidate, catalog.map((c) => c.assetId)).ok;
    const assets = proposal.objects.map((o) => o.assetId);
    const matches = proposal.decision === f.expect.decision && (!f.expect.anyAssets || f.expect.anyAssets.some((id) => assets.includes(id))) && (!f.expect.textLocale || proposal.texts.length > 0);
    row = { id: f.id, model: used, decision: proposal.decision, valid, matches, scene: JSON.stringify(assets) };
  } catch {
    row = { id: f.id, model: real ? 'real' : 'mock', decision: 'error', valid: false, matches: false, scene: '' };
  }
  rows.push(row);
}
const proposed = rows.filter((r) => r.decision === 'propose');
const report = {
  mode: real ? 'real' : 'mock', prompts: rows.length,
  validRate: rows.filter((r) => r.valid).length / rows.length,
  expectationRate: rows.filter((r) => r.matches).length / rows.length,
  distinctScenes: new Set(proposed.map((r) => r.scene)).size / Math.max(1, proposed.length),
  targets: fixtures.targets, rows,
};
console.log(JSON.stringify(report, null, 2));
