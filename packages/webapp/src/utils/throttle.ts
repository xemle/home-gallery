export const throttle = (fn, delay) => {
  let timerId;

  return () => {
    if (timerId) {
      return;
    }
    timerId = setTimeout(() => {
      timerId = undefined;
      fn();
    }, delay);
  }
}
