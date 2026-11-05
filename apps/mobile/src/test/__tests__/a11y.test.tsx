import { Dimensions, Pressable, Switch, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { cappedTexts, renderSweep, unlabeledTouchables } from '../a11y';
import { splitBigDay } from '../../ui/textScale';

const tree = async (element: React.ReactElement) => { const { screen, restore } = await renderSweep(element, 'ko-KR'); const json = screen.toJSON(); restore(); return json; };

describe('unlabeledTouchables', () => {
  it('flags a touchable with no role and one with no spoken name', async () => {
    const found = unlabeledTouchables(await tree(<View>
      <Pressable onPress={() => {}}><Text>Has text, no role</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => {}}><View /></Pressable>
      <Switch value={false} />
      <TextInput />
    </View>));
    expect(found).toHaveLength(4);
    expect(found[0]).toContain('missing role');
    expect(found[1]).toContain('missing name');
  });
  it('accepts a labelled control, a text-named button and controls VoiceOver does not reach', async () => {
    expect(unlabeledTouchables(await tree(<View>
      <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => {}}><View /></Pressable>
      <Pressable accessibilityRole="button" onPress={() => {}}><Text>Save</Text></Pressable>
      <TextInput accessibilityLabel="Title" />
      <View accessible accessibilityRole="adjustable" accessibilityLabel="Year"><Pressable onPress={() => {}}><Text>2026</Text></Pressable></View>
      <Pressable accessible={false} onPress={() => {}}><View /></Pressable>
      <View accessibilityElementsHidden><Pressable onPress={() => {}}><View /></Pressable></View>
    </View>))).toEqual([]);
  });
});

describe('cappedTexts', () => {
  it('reports line-capped text and ignores uncapped and hidden text', async () => {
    expect(cappedTexts(await tree(<View>
      <Text numberOfLines={1}>Title that large text would cut</Text>
      <Text>Wraps freely</Text>
      <View importantForAccessibility="no-hide-descendants"><Text numberOfLines={2}>Decor</Text></View>
    </View>))).toEqual([{ lines: 1, text: 'Title that large text would cut' }]);
  });
});

describe('renderSweep', () => {
  function Probe({ id }: { id: string }) { const { t } = useTranslation(); return <Text>{t(id)}</Text>; }
  it('records a key a language lacks instead of falling back to English, and passes the text size through', async () => {
    const { missing, restore } = await renderSweep(<Probe id="no.such.key" />, 'ja-JP');
    expect(missing).toEqual(['ja-JP no.such.key']);
    restore();
    const base = Dimensions.get('window').fontScale;
    const ok = await renderSweep(<Probe id="common.save" />, 'ja-JP', 1.5);
    expect(ok.missing).toEqual([]);
    expect(Dimensions.get('window').fontScale).toBe(1.5);
    ok.restore();
    expect(Dimensions.get('window').fontScale).toBe(base);
  });
});

describe('splitBigDay', () => {
  it('puts the word and the number on two lines and leaves a trailing-unit label whole', () => {
    expect(splitBigDay('Day 492', 492)).toBe('Day\n492');
    expect(splitBigDay('D+492', 492)).toBe('D+\n492');
    expect(splitBigDay('492日目', 492)).toBe('492日目');
  });
});
