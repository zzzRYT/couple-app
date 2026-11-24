import { tokens } from './tokens';
import { useDisplayAppearance } from '../lib/preferences';

export function useAppColor() {
  const { scheme, highContrast } = useDisplayAppearance();
  return tokens.color.app[scheme][highContrast ? 'highContrast' : 'normal'];
}
