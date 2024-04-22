import { flushUpdaterQueue, updaterQueue } from "./Component";

export function addEvent(dom, eventName, bindFunction) {
  //   debugger;
  dom.attach = dom.attach || {};
  dom.attach[eventName] = bindFunction;
  // 事件合成机制的核心点一：事件绑定到document
  if (document[eventName]) return;
  document[eventName] = dispatchEvent;
}

function dispatchEvent(nativeEvent) {
  // 事件触发时需要批量更新
  updaterQueue.isBatch = true;
  // 时间合成机制的核心点二：屏蔽浏览器之间的差异
  let syntheticEvent = createSyntheticEvent(nativeEvent);

  // 事件源，触发事件的对象
  let target = nativeEvent.target;
  while (target) {
    // console.log("target", target);
    // 让合成事件的currentTarget 始终指向 target
    syntheticEvent.currentTarget = target;
    let eventName = `on${nativeEvent.type}`;
    let bindFunction = target.attach && target.attach[eventName];
    bindFunction && bindFunction(syntheticEvent);
    // 阻止冒泡
    if (syntheticEvent.isPropagationStopped) {
      break;
    }
    // 冒泡机制，从内向外遍历
    target = target.parentNode;
  }

  flushUpdaterQueue();
}

function createSyntheticEvent(nativeEvent) {
  let nativeEventKeyValues = {};

  // 不用 Object.keys 是因为 Object.keys 不会遍历原型链上的属性以及Symbol属性
  for (let key in nativeEvent) {
    nativeEventKeyValues[key] =
      typeof nativeEvent[key] === "function"
        ? nativeEvent[key].bind(nativeEvent) // 绑定上下文
        : nativeEvent[key];
  }

  let syntheticEvent = Object.assign(nativeEventKeyValues, {
    nativeEvent,
    isDefaultPrevented: false,
    isPropagationStopped: false,
    preventDefault: function () {
      this.isDefaultPrevented = true;
      if (this.nativeEvent.preventDefault) {
        this.nativeEvent.preventDefault();
      } else {
        this.nativeEvent.returnValue = false;
      }
    },
    stopPropagation: function () {
      this.isPropagationStopped = true;
      if (this.nativeEvent.stopPropagation) {
        this.nativeEvent.stopPropagation();
      } else {
        this.nativeEvent.cancelBubble();
      }
    },
  });

  return syntheticEvent;
}
