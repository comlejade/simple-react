import { emitUpdateForHooks } from "./react-dom";

let states = [];
let hookIndex = 0;

export function useState(initialValue) {
  states[hookIndex] = states[hookIndex] || initialValue;
  const currentIndex = hookIndex;
  function setState(newState) {
    states[currentIndex] = newState;
    emitUpdateForHooks();
  }

  return [states[hookIndex++], setState];
}

export function resetHookIndex() {
  hookIndex = 0;
}

export function useReducer(reducer, initialValue) {
  states[hookIndex] = states[hookIndex] || initialValue;
  const currentIndex = hookIndex;
  function dispatch(action) {
    states[currentIndex] = reducer(states[currentIndex], action);
    emitUpdateForHooks();
  }

  return [states[hookIndex++], dispatch];
}

export function useEffect(effectFunction, deps = []) {
  const currentIndex = hookIndex;
  const [destroyFunction, preDeps] = states[currentIndex] || [null, null];

  if (
    !states[hookIndex] ||
    deps.some((item, index) => item !== preDeps[index])
  ) {
    setTimeout(() => {
      destroyFunction && destroyFunction();
      states[currentIndex] = [effectFunction(), deps];
    });
  }

  hookIndex++;
}

export function useLayoutEffect(effectFunction, deps = []) {
  const currentIndex = hookIndex;
  const [destroyFunction, preDeps] = states[currentIndex] || [null, null];

  if (
    !states[hookIndex] ||
    deps.some((item, index) => item !== preDeps[index])
  ) {
    queueMicrotask(() => {
      destroyFunction && destroyFunction();
      states[currentIndex] = [effectFunction(), deps];
    });
  }

  hookIndex++;
}

export function useRef(initialValue) {
  states[hookIndex] = states[hookIndex] || { current: initialValue };

  return states[hookIndex++];
}

export function useImperativeHandle(ref, dataFactory) {
  ref.current = dataFactory();
}

export function useMemo(dataFactory, deps = []) {
  let [prevData, prevDeps] = states[hookIndex] || [null, null];
  if (
    !states[hookIndex] ||
    deps.some((item, index) => item !== prevDeps[index])
  ) {
    let newData = dataFactory();
    states[hookIndex++] = [newData, deps];
    return newData;
  } else {
    hookIndex++;
    return prevData;
  }
}

export function useCallback(callback, deps = []) {
  let [prevCallback, prevDeps] = states[hookIndex] || [null, null];
  if (
    !states[hookIndex] ||
    deps.some((item, index) => item !== prevDeps[index])
  ) {
    states[hookIndex++] = [callback, deps];
    return callback;
  } else {
    hookIndex++;
    return prevCallback;
  }
}
