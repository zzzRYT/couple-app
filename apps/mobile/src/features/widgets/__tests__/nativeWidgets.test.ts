import type { i18n } from 'i18next';

const mockNativeModule = jest.fn();
const mockInstallWidgets = jest.fn();
jest.mock('expo', () => ({ requireOptionalNativeModule: () => mockNativeModule() }));
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { scheme: ['aroom-dev', 'aroom'] } } }));
jest.mock('../writer', () => ({ installWidgets: mockInstallWidgets }));
const mockDefinitions = jest.fn();
jest.mock('../definitions', () => mockDefinitions());

const translator = {} as i18n;
const install = () => jest.isolateModules(() => {
  (jest.requireActual('../nativeWidgets') as typeof import('../nativeWidgets')).installNativeWidgets(translator);
});

describe('installNativeWidgets', () => {
  beforeEach(() => { jest.clearAllMocks(); mockDefinitions.mockReturnValue({ widgets: {} }); });
  it('stays off on a build without the widget module', () => {
    mockNativeModule.mockReturnValue(null);
    install();
    expect(mockDefinitions).not.toHaveBeenCalled();
    expect(mockInstallWidgets).not.toHaveBeenCalled();
  });
  it('stays off on a build whose App Group is not configured', () => {
    mockNativeModule.mockReturnValue({ widgetsDirectory: null });
    install();
    expect(mockDefinitions).not.toHaveBeenCalled();
    expect(mockInstallWidgets).not.toHaveBeenCalled();
  });
  it('turns the writer on when the App Group exists', () => {
    mockNativeModule.mockReturnValue({ widgetsDirectory: 'file:///group/ExpoWidgets/' });
    install();
    expect(mockInstallWidgets).toHaveBeenCalledWith(expect.objectContaining({ translator }));
  });
  it('lets the app start when the widgets cannot load', () => {
    mockNativeModule.mockReturnValue({ widgetsDirectory: 'file:///group/ExpoWidgets/' });
    mockDefinitions.mockImplementation(() => { throw new Error('no extension'); });
    expect(install).not.toThrow();
    expect(mockInstallWidgets).not.toHaveBeenCalled();
  });
});
