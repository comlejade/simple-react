import { Component } from "./Component";
import {
  REACT_ELEMENT,
  REACT_FORWARD_REF,
  REACT_MEMO,
  toVNode,
} from "./constants";
import { shallowEqual } from "./utils";

export * from "./hooks";

function createElement(type, properties, children) {
  let ref = properties.ref || null;
  let key = properties.key || null;

  ["__self", "__source", "ref", "key"].forEach((key) => {
    delete properties[key];
  });

  let props = { ...properties };

  if (arguments.length > 3) {
    props.children = Array.prototype.slice.call(arguments, 2).map(toVNode);
  } else {
    props.children = toVNode(children);
  }

  return {
    $$typeof: REACT_ELEMENT,
    type,
    ref,
    key,
    props,
  };
}

function createRef() {
  return {
    current: null,
  };
}

function forwardRef(render) {
  return {
    $$typeof: REACT_FORWARD_REF,
    render,
  };
}

class PureComponent extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    return (
      !shallowEqual(this.props, nextProps) ||
      !shallowEqual(this.state, nextState)
    );
  }
}

// 相当于加标记
function memo(type, compare) {
  return {
    $$typeof: REACT_MEMO,
    type,
    compare,
  };
}

const React = {
  createElement,
  Component,
  createRef,
  forwardRef,
  PureComponent,
  memo,
};

export default React;
