// Deterministic pre-checks run before any model call; the model and the validator still apply afterwards.
const MASCOT = /(마스코트|캐릭터|아루미|mascot|character|aroomi|マスコット|キャラ|アルーミ)/i;
const APPEARANCE = /(옷|의상|색|표정|포즈|바꿔|바꾸|교체|새로\s*그려|다시\s*그려|outfit|dress|cloth|colou?r|expression|pose|replace|redraw|re-draw|swap|change|服|衣装|色|表情|ポーズ|変え|替え|描き直)/i;
export function asksToChangeMascot(prompt: string): boolean {
  return MASCOT.test(prompt) && APPEARANCE.test(prompt);
}
