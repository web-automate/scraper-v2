export enum AspectRatio {
  SQUARE = '1:1',
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
  ULTRAWIDE = '21:9',
  CLASSIC = '4:3'
}

export const getAspectRatioInstruction = (ratio: AspectRatio): string => {
  switch (ratio) {
    case AspectRatio.LANDSCAPE:
    case AspectRatio.ULTRAWIDE:
      return "Wide cinematic composition, horizontal layout.";
    case AspectRatio.PORTRAIT:
      return "Tall vertical composition, suitable for phone wallpaper or full-body portraits.";
    case AspectRatio.CLASSIC:
      return "Classic television or photography composition.";
    case AspectRatio.SQUARE:
    default:
      return "Symmetrical square composition.";
  }
};