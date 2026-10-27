import type { DecorationModel, ModelInput, ModelProposal } from '../anthropic.ts';
import { ModelFailure } from '../anthropic.ts';

export type Reply = ModelProposal | 'fail' | ((input: ModelInput) => ModelProposal);
/** Spy model: records every payload it receives and answers from a script. */
export function fakeModel(replies: Reply[] = [], fallback: Reply = starProposal()) {
  const calls: { input: ModelInput; escalate: boolean }[] = [];
  const model: DecorationModel = {
    propose(input, { escalate }) {
      calls.push({ input: structuredClone(input), escalate });
      const reply = replies.shift() ?? fallback;
      if (reply === 'fail') return Promise.reject(new ModelFailure());
      return Promise.resolve({ proposal: typeof reply === 'function' ? reply(input) : structuredClone(reply), model: 'fake-model' });
    },
  };
  return { model, calls };
}
const mascot = { assetId: 'app_mascot', x: 0.5, y: 0.72, width: 0.2, height: 0.2, rotationDeg: 0, zIndex: 1, opacity: 1 };
const presentation = { visible: true, x: 0.5, y: 0.17, width: 0.84, height: 0.14, styleToken: 'day.default', textScale: 1 };
export function starProposal(assetId = 'obj_sky_star', text?: string): ModelProposal {
  return { decision: 'propose', objects: [mascot, { ...mascot, assetId, x: 0.3, y: 0.4, width: 0.12, height: 0.12, zIndex: 2 }],
    texts: text ? [{ text, x: 0.5, y: 0.55, width: 0.5, height: 0.06, rotationDeg: 0, zIndex: 3, styleToken: 'text.primary' }] : [], presentation };
}
export const unsupported: ModelProposal = { decision: 'unsupported', objects: [], texts: [], presentation };
