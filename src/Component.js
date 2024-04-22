import { findDomByVNode, updateDomTree } from "./react-dom";

// 批量更新
export let updaterQueue = {
  isBatch: false,
  updaters: new Set(),
};

// 清空 updaterQueue
export function flushUpdaterQueue() {
  // 批量更新之后需要重置 isBatch
  updaterQueue.isBatch = false;

  for (let updater of updaterQueue.updaters) {
    // 批量合并state
    updater.launchUpdate();
  }

  // 批量合并完之后清空队列
  updaterQueue.updaters.clear();
}

// state 更新器
class Updater {
  constructor(ClassComponentInstance) {
    this.ClassComponentInstance = ClassComponentInstance;
    // 需要更新的state的记录
    this.penddingStates = [];
  }

  addState(partialState) {
    // debugger;
    // 记录下来需要更新的state
    this.penddingStates.push(partialState);
    // 对更新进行预处理
    this.preHandleForUpdate();
  }

  // 更新预处理
  preHandleForUpdate() {
    // 是否批量更新
    if (updaterQueue.isBatch) {
      updaterQueue.updaters.add(this);
    } else {
      // 不需要批量更新，直接合并
      this.launchUpdate();
    }
  }

  // 合并 state
  launchUpdate() {
    const { ClassComponentInstance, penddingStates } = this;
    if (penddingStates.length === 0) return;
    // reduce 遍历数组更新 state
    ClassComponentInstance.state = penddingStates.reduce(
      (preState, newState) => {
        return { ...preState, ...newState };
      },
      ClassComponentInstance.state
    );
    // 处理完毕
    this.penddingStates.length = 0;
    ClassComponentInstance.update();
  }
}

export class Component {
  static IS_CLASS_COMPONENT = true;
  constructor(props) {
    this.updater = new Updater(this);
    this.state = {};
    this.props = props;
  }

  setState(partialState) {
    // 合并属性
    // 更新
    this.updater.addState(partialState);
  }

  update() {
    // 获取重新执行 render 函数后的虚拟DOM，生成新的虚拟DOM
    // 根据新的虚拟DOM，生成真实DOM
    // 挂在真实DOM
    // TODO: 让类组件拥有一个oldVNode属性保存类组件实例对应的虚拟DOM
    let oldVNode = this.oldVNode;
    // TODO: 将真实DOM保存到对应的虚拟DOM上
    let oldDOM = findDomByVNode(oldVNode);
    // 通过 render 获取新的vnode
    let newVNode = this.render();
    // 新旧vnode对比，更新真实DOM
    updateDomTree(oldDOM, newVNode);
    // 更新完，新的虚拟DOM变成旧的虚拟DOM
    this.oldVNode = newVNode;
  }
}
