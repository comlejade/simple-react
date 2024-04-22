import { REACT_ELEMENT, REACT_FORWARD_REF } from "./constants";
import { addEvent } from "./event";

function render(VNode, containerDOM) {
  // 将虚拟dom转成真实dom
  // 将得到的真实dom挂载到container
  mount(VNode, containerDOM);
}

function mount(VNode, containerDOM) {
  let newDOM = createDOM(VNode);
  newDOM && containerDOM.appendChild(newDOM);
}

function createDOM(VNode) {
  const { type, props, ref } = VNode;
  let dom;
  //   debugger;
  //   console.log(VNode);

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

  if (type && VNode.$$typeof === REACT_ELEMENT) {
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

function getDomByForwardRefFunction(VNode) {
  let { type, props, ref } = VNode;
  let renderVNode = type.render(props, ref);

  if (!renderVNode) return null;

  return createDOM(renderVNode);
}

function getDomByClassComponent(VNode) {
  let { type, props, ref } = VNode;
  let instance = new type(props);

  // 类组件 ref，指向类实例
  ref && (ref.current = instance);

  let renderVNode = instance.render();
  instance.oldVNode = renderVNode;

  if (!renderVNode) return null;

  return createDOM(renderVNode);
}

function getDomByFunctionComponent(VNode) {
  let { type, props } = VNode;

  let renderVNode = type(props);

  if (!renderVNode) return null;

  return createDOM(renderVNode);
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
  for (let i = 0; i < children.length; i++) {
    if (typeof children[i] === "string") {
      parent.appendChild(document.createTextNode(children[i]));
    } else {
      mount(children[i], parent);
    }
  }
}

export function findDomByVNode(VNode) {
  if (!VNode) return;
  if (VNode.dom) return VNode.dom;
}

export function updateDomTree(oldDOM, newVNode) {
  let parentNode = oldDOM.parentNode;
  parentNode.removeChild(oldDOM);
  parentNode.appendChild(createDOM(newVNode));
}

const ReactDOM = {
  render,
};

export default ReactDOM;
