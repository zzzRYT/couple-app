import { useColorScheme } from 'react-native';
import { tokens } from './tokens';

export function useAppColor() {
  return tokens.color.app[useColorScheme() === 'dark' ? 'dark' : 'light'].normal;
}
