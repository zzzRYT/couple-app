/** The home cover uses one fixed square frame on every supported device. */
export const COVER_ASPECT_RATIO = 1;
export const COVER_PICKER_ASPECT: [number, number] = [1, 1];
/** The system editor returns pixels already cropped to the fixed cover frame. */
export const COVER_CROP = { x: 0, y: 0, width: 1, height: 1 } as const;
