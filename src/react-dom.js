import {
  CREATE,
  MOVE,
  REACT_ELEMENT,
  REACT_FORWARD_REF,
  REACT_MEMO,
  REACT_TEXT,
} from "./constants";
import { addEvent } from "./event";
import { resetHookIndex } from "./hooks";
import { shallowEqual } from "./utils";

export let emitUpdateForHooks;

function render(VNode, containerDOM) {
  // 将虚拟dom转成真实dom
  // 将得到的真实dom挂载到container
  mount(VNode, containerDOM);
  emitUpdateForHooks = () => {
    resetHookIndex();
    updateDomTree(VNode, VNode, findDomByVNode(VNode));
  };
}

function mount(VNode, containerDOM) {
  let newDOM = createDOM(VNode);
  newDOM && containerDOM.appendChild(newDOM);
}

function createDOM(VNode) {
  const { type, props, ref } = VNode;
  let dom;

  // 处理 memo
  if (type && type.$$typeof === REACT_MEMO) {
    return getDomByMemoFunctionComponent(VNode);
  }

  // 处理 forwardRef
  if (type && type.$$typeof === REACT_FORWARD_REF) {
    return getDomByForwardRefFunction(VNode);
  }

  // 处理类组件
  if (
    typeof type === "function" &&
    VNode.$$typeof === REACT_ELEMENT &&
    type.IS_CLASS_COMPONENT
  ) {
    return getDomByClassComponent(VNode);
  }

  // 处理函数式组件
  if (typeof type === "function" && VNode.$$typeof === REACT_ELEMENT) {
    return getDomByFunctionComponent(VNode);
  }

  if (type === REACT_TEXT) {
    dom = document.createTextNode(props.text);
  } else if (type && VNode.$$typeof === REACT_ELEMENT) {
    dom = document.createElement(type);
  }

  if (props) {
    // 子元素是VNode
    if (typeof props.children === "object" && props.children.type) {
      mount(props.children, dom);
    } else if (Array.isArray(props.children)) {
      // 有多个子节点
      mountArray(props.children, dom);
    } else if (typeof props.children === "string") {
      dom.appendChild(document.createTextNode(props.children));
    }
  }

  setPropsForDOM(dom, props);

  // 将真实dom和虚拟DOM关联
  VNode.dom = dom;
  // 原生ref标签指向dom
  ref && (ref.current = dom);

  //   console.log("dom", dom);

  return dom;
}

function getDomByMemoFunctionComponent(VNode) {
  let { type, props } = VNode;
  let renderVNode = type.type(props);
  if (!renderVNode) return null;

  VNode.oldRenderVNode = renderVNode;
  return createDOM(renderVNode);
}

function getDomByForwardRefFunction(VNode) {
  let { type, props, ref } = VNode;
  // render 就是传入forwardRef的函数
  let renderVNode = type.render(props, ref);

  if (!renderVNode) return null;

  return createDOM(renderVNode);
}

function getDomByClassComponent(VNode) {
  let { type, props, ref } = VNode;
  let instance = new type(props);
  VNode.classInstance = instance;

  // 类组件 ref，指向类实例
  ref && (ref.current = instance);

  let renderVNode = instance.render();
  instance.oldVNode = renderVNode;

  if (!renderVNode) return null;

  let dom = createDOM(renderVNode);
  // 这里的生命周期实际应在 mount中调用，写在这里是为了简单
  // 这里只是创新了新的真实dom，还没有挂载
  if (instance.componentDidMount) {
    instance.componentDidMount();
  }
  return dom;
}

function getDomByFunctionComponent(VNode) {
  let { type, props } = VNode;

  let renderVNode = type(props);

  if (!renderVNode) return null;
  VNode.oldRenderVNode = renderVNode;
  let dom = (VNode.dom = createDOM(renderVNode));

  return dom;
}

function setPropsForDOM(dom, VNodeProps = {}) {
  if (!dom) return;
  for (let key in VNodeProps) {
    if (key === "children") continue;
    if (/^on[A-Z].*/.test(key)) {
      //   debugger;
      addEvent(dom, key.toLowerCase(), VNodeProps[key]);
    } else if (key === "style") {
      Object.keys(VNodeProps[key]).forEach((styleName) => {
        dom[key][styleName] = VNodeProps[key][styleName];
      });
    } else {
      dom[key] = VNodeProps[key];
    }
  }
  //   console.log(VNodeProps);
}

function mountArray(children, parent) {
  if (!Array.isArray(children)) return;
  children = children.filter(Boolean);
  for (let i = 0; i < children.length; i++) {
    children[i].index = i;
    mount(children[i], parent);
  }
}

export function findDomByVNode(VNode) {
  if (!VNode) return;
  if (VNode.dom) return VNode.dom;
}

// Diff 算法起点
export function updateDomTree(oldVNode, newVNode, oldDOM) {
  // 新节点，旧节点都不存在
  // 新节点存在，旧节点不存在
  // 新节点不存在，旧节点存在
  // 新节点存在，旧节点也存在，但是类型不一样
  // 新节点存在，旧节点也存在，类型也一样，值得我们进行深入的比较，探索复用相关节点的方案
  const typeMap = {
    NO_OPERATE: !oldVNode && !newVNode,
    ADD: !oldVNode && newVNode,
    DELETE: oldVNode && !newVNode,
    REPLACE: oldVNode && newVNode && oldVNode.type !== newVNode.type,
  };

  let UPATE_TYPE = Object.keys(typeMap).filter((key) => typeMap[key])[0];
  switch (UPATE_TYPE) {
    case "NO_OPERATE":
      break;
    case "DELETE":
      removeVNode(oldVNode);
      break;
    case "ADD":
      oldDOM.parentNode.appendChild(createDOM(newVNode));
      break;
    case "REPLACE":
      removeVNode(oldVNode);
      oldDOM.parentNode.appendChild(createDOM(newVNode));
      break;
    default:
      // 深度的DOM diff, 新老虚拟DOM都存在且类型相同
      deepDOMDiff(oldVNode, newVNode);
      break;
  }
}

function removeVNode(VNode) {
  const currentDOM = findDomByVNode(VNode);
  if (currentDOM) currentDOM.remove();

  // 类组件卸载时调用的生命周期函数
  if (VNode.classInstance && VNode.classInstance.componentWillUnmount) {
    VNode.classInstance.componentWillUnmount();
  }
}

function deepDOMDiff(oldVNode, newVNode) {
  // 无论是 updateClassComponent 还是 updateFunctionComponent
  // 都会调用 updateDomTree
  // updateDomTree 核心的又是 deepDOMDiff
  // 所以最终都会落到这个函数进行原生DOM节点 ORIGIN_NODE 的处理
  // ORIGIN_NODE 处理的核心就是 updateChildren
  let diffTypeMap = {
    ORIGIN_NODE: typeof oldVNode.type === "string",
    CLASS_COMPONENT:
      typeof oldVNode.type === "function" && oldVNode.type.IS_CLASS_COMPONENT,
    FUNCTION_COMPONENT: typeof oldVNode.type === "function",
    TEXT: oldVNode.type === REACT_TEXT,
    MEMO: oldVNode.type.$$typeof === REACT_MEMO,
  };

  let DIFF_TYPE = Object.keys(diffTypeMap).filter((key) => diffTypeMap[key])[0];

  switch (DIFF_TYPE) {
    case "ORIGIN_NODE":
      let currentDOM = (newVNode.dom = findDomByVNode(oldVNode));
      setPropsForDOM(currentDOM, newVNode.props);
      updateChildren(
        currentDOM,
        oldVNode.props.children,
        newVNode.props.children
      );
      break;
    case "CLASS_COMPONENT":
      // 更新 class 组件
      updateClassComponent(oldVNode, newVNode);
      break;
    case "FUNCTION_COMPONENT":
      // 更新 function 组件
      updateFunctionComponent(oldVNode, newVNode);
      break;
    case "TEXT":
      newVNode.dom = findDomByVNode(oldVNode);
      newVNode.dom.textContent = newVNode.props.text;
      break;
    case "MEMO":
      updateMemoFunctionComponent(oldVNode, newVNode);
      break;
    default:
      break;
  }
}

function updateClassComponent(oldVNode, newVNode) {
  const classInstance = (newVNode.classInstance = oldVNode.classInstance);

  // 合并state之后再执行update，update中重新执行render函数，获取新的虚拟DOM
  // update中执行updateDomTree，更新DOM
  classInstance.updater.launchUpdate(newVNode.props);
}

function updateFunctionComponent(oldVNode, newVNode) {
  let oldDOM = (newVNode.dom = findDomByVNode(oldVNode));
  if (!oldDOM) return;
  const { type, props } = newVNode;
  let newRenderVNode = type(props);
  updateDomTree(oldVNode.oldRenderVNode, newRenderVNode, oldDOM);
  newVNode.oldRenderVNode = newRenderVNode;
}

function updateMemoFunctionComponent(oldVNode, newVNode) {
  let { type } = oldVNode;

  if (
    (!type.compare && !shallowEqual(oldVNode.props, newVNode.props)) ||
    (type.compare && !type.compare(oldVNode.props, newVNode.props))
  ) {
    const oldDOM = findDomByVNode(oldVNode);
    const { type } = newVNode;
    let renderVNode = type.type(newVNode.props);
    updateDomTree(oldVNode.oldRenderVNode, renderVNode, oldDOM);
    newVNode.oldRenderVNode = renderVNode;
  } else {
    newVNode.oldRenderVNode = oldVNode.oldRenderVNode;
  }
}

// DOM DIFF 算法的核心
function updateChildren(parentDOM, oldVNodeChildren, newVNodeChildren) {
  oldVNodeChildren = (
    Array.isArray(oldVNodeChildren) ? oldVNodeChildren : [oldVNodeChildren]
  ).filter(Boolean);
  newVNodeChildren = (
    Array.isArray(newVNodeChildren) ? newVNodeChildren : [newVNodeChildren]
  ).filter(Boolean);

  // 遍历更新 lastNotChangedIndex
  let lastNotChangedIndex = -1;
  let oldKeyChildMap = {};

  oldVNodeChildren.forEach((oldVNode, index) => {
    let oldKey = oldVNode && oldVNode.key ? oldVNode.key : index;
    oldKeyChildMap[oldKey] = oldVNode;
  });

  // 遍历新的子虚拟DOM数组，找到可以复用但需要移动的节点，需要重新创建的节点，需要删除的节点，剩下的就是可复用但不用移动的节点
  let actions = [];
  // 第一次遍历，找到不需要移动的节点，并为需要操作的节点打标记，然后放入新的actions数组中
  // 总结，第一次遍历，更新老节点，然后打标记
  newVNodeChildren.forEach((newVNode, index) => {
    newVNode.index = index;
    let newKey = newVNode.key ? newVNode.key : index;
    // 拿新的虚拟节点的key 去老的节点映射中寻找相应的节点
    // 看能否找到
    let oldVNode = oldKeyChildMap[newKey];

    // 注意这里是在遍历新节点，
    // 如果找到的新节点在老节点中有值就会更新
    // lastNotChangedIndex，但如果后面查找到的节点比前面记录的值小
    // 说明这个节点在老节点中有，但是原来在前面，需要移动到后面去
    // 所以就会被标记为移动 MOVE

    if (oldVNode) {
      // 再老节点中能找到，就需要更新
      deepDOMDiff(oldVNode, newVNode);
      if (oldVNode.index < lastNotChangedIndex) {
        // 如果找到的老节点的 index 比 lastNotChangedIndex 小
        // 标记为需要移动
        actions.push({
          type: MOVE,
          oldVNode,
          newVNode,
          index,
        });
      }

      // 能复用的就从 oldKeyChildMap 中删除
      delete oldKeyChildMap[newKey];
      // 如果老节点的index 比 lastNotChangedIndex 大，更新 lastNotChangedIndex
      lastNotChangedIndex = Math.max(lastNotChangedIndex, oldVNode.index);
    } else {
      // 老节点中没有就需要创建，将type标记为 CREATE
      actions.push({
        type: CREATE,
        newVNode,
        index,
      });
    }
  });

  // 找到需要移动的节点
  let VNodeToMove = actions
    .filter((action) => action.type === MOVE)
    .map((action) => action.oldVNode);

  // 找到需要删除的节点
  // 再上面的判断中，能复用的已经从 oldKeyChildMap中删除，剩下的就是不能复用的
  // 都是要删除的
  let VNodeToDelete = Object.values(oldKeyChildMap);

  // 把需要移动的和需要删除的都从DOM树中删除
  VNodeToMove.concat(VNodeToDelete).forEach((oldVNode) => {
    let currentDOM = findDomByVNode(oldVNode);
    currentDOM.remove();
  });

  // actions 中存储的是新节点中去除不需要移动的节点后，需要执行的操作和节点信息的列表
  // 也就是第二次遍历
  // 第二次遍历需要操作的节点
  actions.forEach((action) => {
    let { type, oldVNode, newVNode, index } = action;
    // 这里的childNodes 是删除需要移动的节点和需要删除的节点之后剩下的不需要动的节点
    let childNodes = parentDOM.childNodes;

    let childNode = childNodes[index];
    // index 是老节点在新节点列表中的索引，
    // 如果这个索引处有值，那就把它插入到这个值的前面
    // 对于[A, B]来说，如果C要插入到 1 的索引位置，就是把 B 往后挪一下，C插进去
    // 相当于插到了 B 的前面
    // 对于DOM操作就是insertBefore
    const getDomForInsert = () => {
      if (type === CREATE) {
        return createDOM(newVNode);
      }

      if (type === MOVE) {
        return findDomByVNode(oldVNode);
      }
    };

    if (childNode) {
      parentDOM.insertBefore(getDomForInsert(), childNode);
    } else {
      parentDOM.appendChild(getDomForInsert());
    }
  });
}

const ReactDOM = {
  render,
};

export default ReactDOM;
