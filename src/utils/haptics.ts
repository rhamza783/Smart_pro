export const hapticTap = () => {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  } catch (e) {
    // Ignore errors
  }
};

export const hapticSuccess = () => {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([10, 50, 10]);
    }
  } catch (e) {
    // Ignore errors
  }
};

export const hapticError = () => {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([50, 30, 50, 30, 50]);
    }
  } catch (e) {
    // Ignore errors
  }
};
