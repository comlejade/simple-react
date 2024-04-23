export const deepClone = (data, map = new WeakMap()) => {
  let type = getType(data);

  if (type !== "array" || type !== "object") return data;
  let resultValue = type === "array" ? [] : {};

  if (map.has(data)) {
    return map.get(data);
  }

  map.set(data, resultValue);

  if (type === "array") {
    data.forEach((item) => {
      resultValue.push(deepClone(item, map));
    });
  }

  if (type === "object") {
    for (let key in data) {
      if (data.hasOwnProperty(key)) {
        resultValue[key] = deepClone(data[key], map);
      }
    }
  }

  return resultValue;
};

export function getType(obj) {
  //   debugger;
  let type = Object.prototype.toString
    .call(obj)
    .match(/^\[object ([A-Z][a-z]+)\]/)[1];
  return type.toLowerCase();
}

export const shallowEqual = (obj1, obj2) => {
  //   debugger;
  if (obj1 === obj2) {
    return true;
  }

  if (getType(obj1) !== "object" || getType(obj2) !== "object") {
    // console.log("111");
    return false;
  }

  let keys1 = Object.keys(obj1);
  let keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    // console.log("222");
    return false;
  }

  for (let key of keys1) {
    if (!obj2.hasOwnProperty(key) || obj1[key] !== obj2[key]) {
      //   console.log("333", obj1[key], obj2[key]);
      return false;
    }
  }

  return true;
};
