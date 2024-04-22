import ReactDOM from "./react-dom";
import React from "./react";

// const root = ReactDOM.createRoot(document.getElementById("root"));
// root.render(<div>hello</div>);

// ReactDOM.render(<div>hello</div>, document.getElementById("root"));

function MyFunctionalComponent() {
  return (
    <div style={{ color: "red" }}>
      hello<span>111</span>
      <span>222</span>
    </div>
  );
}

class MyClassComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = { xxx: "999" };

    setTimeout(() => {
      this.setState({ xxx: "888" });
    }, 3000);
  }

  render() {
    return <div style={{ color: "red" }}>{this.state.xxx}</div>;
  }
}

// let element = <MyFunctionalComponent></MyFunctionalComponent>;
// console.log(element);

let element2 = <MyClassComponent></MyClassComponent>;
console.log(element2);

ReactDOM.render(element2, document.getElementById("root"));
