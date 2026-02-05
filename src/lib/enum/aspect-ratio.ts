export enum AspectRatio {
  SQUARE = '1:1',
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
  ULTRAWIDE = '21:9',
  CLASSIC = '4:3',
  SOCIAL_PORTRAIT = '4:5',
  CLASSIC_PORTRAIT = '3:4',
  PHOTO_LANDSCAPE = '3:2',
  PHOTO_PORTRAIT = '2:3',
  WIDE_MONITOR = '16:10',
  CINEMATIC_SCOPE = '2.35:1'
}

export const getAspectRatioInstruction = (ratio: AspectRatio): string => {
  switch (ratio) {
    case AspectRatio.LANDSCAPE:
    case AspectRatio.ULTRAWIDE:
    case AspectRatio.WIDE_MONITOR:
    case AspectRatio.CINEMATIC_SCOPE:
      return "Wide cinematic or monitor-style horizontal composition.";
    case AspectRatio.PHOTO_LANDSCAPE:
      return "Standard 35mm DSLR landscape photography frame.";
    case AspectRatio.PORTRAIT:
      return "Tall vertical composition, suitable for phone wallpaper or full-body portraits.";
    case AspectRatio.SOCIAL_PORTRAIT:
      return "Vertical composition optimized for social media feeds.";
    case AspectRatio.PHOTO_PORTRAIT:
    case AspectRatio.CLASSIC_PORTRAIT:
      return "Standard portrait photography composition.";
    case AspectRatio.CLASSIC:
      return "Classic television or photography composition.";
    case AspectRatio.SQUARE:
    default:
      return "Symmetrical square composition.";
  }
};