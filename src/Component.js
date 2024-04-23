import { findDomByVNode, updateDomTree } from "./react-dom";
import { deepClone } from "./utils";

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
  constructor(classComponentInstance) {
    this.classComponentInstance = classComponentInstance;
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
  launchUpdate(nextProps) {
    const { classComponentInstance, penddingStates } = this;

    if (penddingStates.length === 0 && !nextProps) return;
    let isShouldUpdate = true;

    let prevProps = deepClone(classComponentInstance.props);
    let prevState = deepClone(classComponentInstance.state);
    // reduce 遍历数组更新 state
    let nextState = penddingStates.reduce((preState, newState) => {
      return { ...preState, ...newState };
    }, classComponentInstance.state);

    // 处理完毕
    this.penddingStates.length = 0;
    // 处理生命周期函数 shouldComponentUpdate
    // 状态合并了，但是是否继续渲染，要看shouldComponentUpdate
    if (
      classComponentInstance.shouldComponentUpdate &&
      !classComponentInstance.shouldComponentUpdate(nextProps, nextState)
    ) {
      isShouldUpdate = false;
    }

    classComponentInstance.state = nextState;
    if (nextProps) {
      classComponentInstance.props = nextProps;
    }

    if (isShouldUpdate) {
      classComponentInstance.update(prevProps, prevState);
    }
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

  update(prevProps, prevState) {
    // 获取重新执行 render 函数后的虚拟DOM，生成新的虚拟DOM
    // 根据新的虚拟DOM，生成真实DOM
    // 挂在真实DOM
    // TODO: 让类组件拥有一个oldVNode属性保存类组件实例对应的虚拟DOM
    let oldVNode = this.oldVNode;
    // TODO: 将真实DOM保存到对应的虚拟DOM上
    let oldDOM = findDomByVNode(oldVNode);

    // 生命周期方法 static getDerivedStateFromProps 在每次 render 之前执行
    // 静态方法，只能从 constructor 中获取，不能从 this 中获取
    if (this.constructor.getDerivedStateFromProps) {
      let newState = this.constructor.getDerivedStateFromProps(
        this.props,
        this.state
      );
      this.state = { ...this.state, ...newState };
    }

    // 通过 render 获取新的vnode
    let newVNode = this.render();

    // 生命周期方法 getSnapShotBeforeUpdate
    // 主要作用是在DOM发生改变之前能够捕获一些信息
    // 通常用在UI组件库中
    let snapshot =
      this.getSnapShotBeforeUpdate &&
      this.getSnapShotBeforeUpdate(prevProps, prevState);
    // 新旧vnode对比，更新真实DOM
    updateDomTree(oldVNode, newVNode, oldDOM);
    // 更新完，新的虚拟DOM变成旧的虚拟DOM
    this.oldVNode = newVNode;

    // 更新完成的生命周期函数
    if (this.componentDidUpdate) {
      this.componentDidUpdate(this.props, this.state, snapshot);
    }
  }
}
