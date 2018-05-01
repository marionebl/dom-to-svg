export enum BackgroundType {
  None = "none",
  Image = "image",
  LinearGradient = "linear-gradient"
}

export enum BackgroundSizeType {
  None = "none",
  Parsed = "parsed"
}

export enum BackgroundPositionType {
  None = "none",
  Parsed = "parsed"
}

export type Background = BackgroundNone | BackgroundImage | BackgroundGradient;

export interface BackgroundNone {
  type: BackgroundType.None;
}

export interface BackgroundImage {
  type: BackgroundType.Image;
  value: string;
}

export interface BackgroundGradient {
  type: BackgroundType.LinearGradient;
  value: LinearGradient | undefined;
}

export type BackgroundPosition = BackgroundPositionNone | BackgroundPositionParse;

export interface BackgroundPositionNone {
  type: BackgroundPositionType.None;
}

export interface BackgroundPositionParse {
  type: BackgroundPositionType.Parsed;
  left: number;
  top: number;
}

export type BackgroundSize = BackgroundSizeNone | BackgroundSizeParsed;

export interface BackgroundSizeNone {
  type: BackgroundSizeType.None;
}

export interface BackgroundSizeParsed {
  type: BackgroundSizeType.Parsed;
  width: number;
  height: number;
}

export interface LinearGradient {
  angle: string;
  stops: string[];
}

export const parseBackgroundImage = (value: string): Background => {
  if (value === "none") {
    return {
      type: BackgroundType.None
    };
  }

  const urlMatches = value.match(/^url\("(.+)"\)$/i);
  const linearGradientMatches = value.match(/^(?:-webkit-|-moz-|-ms-)?linear-gradient\((.+)\)$/i);

  if (urlMatches && urlMatches.length === 2) {
    // Image
    return {
      type: BackgroundType.Image,
      value: urlMatches[1]
    };
  } else if (linearGradientMatches && linearGradientMatches.length === 2) {
    // Linear gradient
    const linearGradient = parseLinearGradient(linearGradientMatches[1]);

    if (typeof linearGradient !== "undefined") {
      return {
        type: BackgroundType.LinearGradient,
        value: linearGradient
      };
    } else {
      return {
        type: BackgroundType.None
      };
    }
  }

  return {
    type: BackgroundType.None
  };
};

export const parseBackgroundSize = (value: string): BackgroundSize => {
  const sizes = value
    .split(" ")
    .map(size => size.replace("px", ""))
    .map(size => parseFloat(size))
    .filter(size => typeof size === "number" && !Number.isNaN(size));

  if (sizes.length !== 2) {
    return {
      type: BackgroundSizeType.None
    };
  }

  const [width, height] = sizes;
  return { type: BackgroundSizeType.Parsed, width, height };
};

export const parseBackgroundPosition = (value: string): BackgroundPosition => {
  const sizes = value
    .split(" ")
    .map(size => size.replace("px", ""))
    .map(size => parseFloat(size))
    .filter(size => typeof size === "number" && !Number.isNaN(size));

  if (sizes.length !== 2) {
    return {
      type: BackgroundPositionType.None
    };
  }

  const [left, top] = sizes;
  return { type: BackgroundPositionType.Parsed, left, top };
};

const parseLinearGradient = (value: string): LinearGradient | undefined => {
  const parts = [];
  let currentPart = [];
  let i = 0;
  let skipComma = false;

  // There can be commas in colors, carefully break apart the value
  while (i < value.length) {
    const char = value.substr(i, 1);

    if (char === "(") {
      skipComma = true;
    } else if (char === ")") {
      skipComma = false;
    }

    if (char === "," && !skipComma) {
      parts.push(currentPart.join("").trim());
      currentPart = [];
    } else {
      currentPart.push(char);
    }

    if (i === value.length - 1) {
      parts.push(currentPart.join("").trim());
    }
    i++;
  }

  if (parts.length === 2) {
    // Assume 2 color stops
    return {
      angle: "180deg",
      stops: [parts[0], parts[1]]
    };
  } else if (parts.length > 2) {
    // angle + n stops
    const [angle, ...stops] = parts;

    return {
      angle,
      stops
    };
  }

  return;
};
