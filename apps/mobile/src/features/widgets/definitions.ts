import { createWidget } from 'expo-widgets';
import { widgetLayout } from './layout';
import { WIDGET_PLACEHOLDER } from './widgetProps';

/** Also bundled at build time (`initialLayout`), so a widget has its layout and placeholder before the app first runs. */
export const widgets = [createWidget('DDayWidget', widgetLayout, WIDGET_PLACEHOLDER), createWidget('ListWidget', widgetLayout, WIDGET_PLACEHOLDER)];
