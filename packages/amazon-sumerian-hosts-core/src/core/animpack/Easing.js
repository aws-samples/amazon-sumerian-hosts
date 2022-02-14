// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/**
 * @typedef {Object} EasingObject Object containing easing functions
 * @property {Function} In - Easing 'In' function. Should use the signature (k:number):number.
 * @property {Function} Out - Easing 'Out' function. Should use the signature (k:number):number.
 * @property {Function} InOut - Easing 'InOut' function. Should use the signature (k:number):number.
 */

/**
 * Linear Easing
 * @type {EasingObject}
 */
export const Linear = {
  None(k) {
    return k;
  },
  In(k) {
    return k;
  },
  Out(k) {
    return k;
  },
  InOut(k) {
    return k;
  },
};

/**
 * Quadratic Easing
 * @type {EasingObject}
 */
export const Quadratic = {
  In(k) {
    return k * k;
  },
  Out(k) {
    return k * (2 - k);
  },
  InOut(k) {
    k *= 2;
    if (k < 1) {
      return 0.5 * k * k;
    }
    return -0.5 * (--k * (k - 2) - 1);
  },
};

/**
 * Cubic Easing
 * @type {EasingObject}
 */
export const Cubic = {
  In(k) {
    return k * k * k;
  },
  Out(k) {
    return --k * k * k + 1;
  },
  InOut(k) {
    k *= 2;
    if (k < 1) {
      return 0.5 * k * k * k;
    }

    k -= 2;
    return 0.5 * (k * k * k + 2);
  },
};

/**
 * Quartic Easing
 * @type {EasingObject}
 */
export const Quartic = {
  In(k) {
    return k * k * k * k;
  },
  Out(k) {
    return 1 - --k * k * k * k;
  },
  InOut(k) {
    k *= 2;
    if (k < 1) {
      return 0.5 * k * k * k * k;
    }

    k -= 2;
    return -0.5 * (k * k * k * k - 2);
  },
};

/**
 * Quintic Easing
 * @type {EasingObject}
 */
export const Quintic = {
  In(k) {
    return k * k * k * k * k;
  },
  Out(k) {
    return --k * k * k * k * k + 1;
  },
  InOut(k) {
    k *= 2;
    if (k < 1) {
      return 0.5 * k * k * k * k * k;
    }

    k -= 2;
    return 0.5 * (k * k * k * k * k + 2);
  },
};

/**
 * Sinusoidal Easing
 * @type {EasingObject}
 */
export const Sinusoidal = {
  In(k) {
    return 1 - Math.cos((k * Math.PI) / 2);
  },
  Out(k) {
    return Math.sin((k * Math.PI) / 2);
  },
  InOut(k) {
    return 0.5 * (1 - Math.cos(Math.PI * k));
  },
};

/**
 * Exponential Easing
 * @type {EasingObject}
 */
export const Exponential = {
  In(k) {
    return k === 0 ? 0 : 1024 ** (k - 1);
  },
  Out(k) {
    return k === 1 ? 1 : 1 - 2 ** (-10 * k);
  },
  InOut(k) {
    if (k === 0) {
      return 0;
    }
    if (k === 1) {
      return 1;
    }

    k *= 2;
    if (k < 1) {
      return 0.5 * 1024 ** (k - 1);
    }
    return 0.5 * (-(2 ** (-10 * (k - 1))) + 2);
  },
};

/**
 * Circular Easing
 * @type {EasingObject}
 */
export const Circular = {
  In(k) {
    return 1 - Math.sqrt(1 - k * k);
  },
  Out(k) {
    return Math.sqrt(1 - --k * k);
  },
  InOut(k) {
    k *= 2;
    if (k < 1) {
      return -0.5 * (Math.sqrt(1 - k * k) - 1);
    }

    k -= 2;
    return 0.5 * (Math.sqrt(1 - k * k) + 1);
  },
};

/**
 * Elastic Easing
 * @type {EasingObject}
 */
export const Elastic = {
  In(k) {
    let s;
    let a = 0.1;
    const p = 0.4;

    if (k === 0) {
      return 0;
    }

    if (k === 1) {
      return 1;
    }

    if (!a || a < 1) {
      a = 1;
      s = p / 4;
    } else {
      s = (p * Math.asin(1 / a)) / (2 * Math.PI);
    }

    k -= 1;
    return -(a * 2 ** (10 * k) * Math.sin(((k - s) * (2 * Math.PI)) / p));
  },
  Out(k) {
    let s;
    let a = 0.1;
    const p = 0.4;

    if (k === 0) {
      return 0;
    }

    if (k === 1) {
      return 1;
    }

    if (!a || a < 1) {
      a = 1;
      s = p / 4;
    } else {
      s = (p * Math.asin(1 / a)) / (2 * Math.PI);
    }

    return a * 2 ** (-10 * k) * Math.sin(((k - s) * (2 * Math.PI)) / p) + 1;
  },
  InOut(k) {
    let s;
    let a = 0.1;
    const p = 0.4;

    if (k === 0) {
      return 0;
    }

    if (k === 1) {
      return 1;
    }

    if (!a || a < 1) {
      a = 1;
      s = p / 4;
    } else {
      s = (p * Math.asin(1 / a)) / (2 * Math.PI);
    }

    k *= 2;
    if (k < 1) {
      k -= 1;
      return (
        -0.5 * (a * 2 ** (10 * k) * Math.sin(((k - s) * (2 * Math.PI)) / p))
      );
    }

    k -= 1;
    return (
      a * 2 ** (-10 * k) * Math.sin(((k - s) * (2 * Math.PI)) / p) * 0.5 + 1
    );
  },
};

/**
 * Back Easing
 * @type {EasingObject}
 */
export const Back = {
  In(k) {
    const s = 1.70158;
    return k * k * ((s + 1) * k - s);
  },
  Out(k) {
    const s = 1.70158;
    return --k * k * ((s + 1) * k + s) + 1;
  },
  InOut(k) {
    const s = 1.70158 * 1.525;
    k *= 2;
    if (k < 1) {
      return 0.5 * (k * k * ((s + 1) * k - s));
    }

    k -= 2;
    return 0.5 * (k * k * ((s + 1) * k + s) + 2);
  },
};

/**
 * Bounce Easing
 * @type {EasingObject}
 */
export const Bounce = {
  In(k) {
    return 1 - Bounce.Out(1 - k);
  },
  Out(k) {
    if (k < 1 / 2.75) {
      return 7.5625 * k * k;
    } else if (k < 2 / 2.75) {
      k -= 1.5;
      return 7.5625 * (k / 2.75) * k + 0.75;
    } else if (k < 2.5 / 2.75) {
      k -= 2.25;
      return 7.5625 * (k / 2.75) * k + 0.9375;
    }
    k -= 2.625;
    return 7.5625 * (k / 2.75) * k + 0.984375;
  },
  InOut(k) {
    if (k < 0.5) {
      return Bounce.In(k * 2) * 0.5;
    }
    return Bounce.Out(k * 2 - 1) * 0.5 + 0.5;
  },
};
