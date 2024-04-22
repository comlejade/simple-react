import ReactDOM from "./react-dom";
import React from "./react";

class MyClassComponent extends React.Component {
  counter = 0;
  constructor(props) {
    super(props);
    this.state = { count: "0" };
  }

  updateShowText(newText) {
    // console.log(newText);
    // debugger;
    this.setState({
      count: newText + "",
    });
  }

  render() {
    return (
      <div
        style={{
          color: "red",
          cursor: "pointer",
          padding: "6px 12px",
          border: "1px solid gray",
        }}
        onClick={() => this.updateShowText(++this.counter)}
      >
        {this.state.count}
      </div>
    );
  }
}

// class CustomComponent extends React.Component {
//   constructor(props) {
//     super(props);
//     this.textInputRef = React.createRef();
//     this.myComponentRef = React.createRef();
//   }

//   show100() {
//     console.log("show100");
//     this.myComponentRef.current.updateShowText(100);
//   }

//   focusInput() {
//     console.log("focus");
//     this.textInputRef.current.focus();
//   }

//   render() {
//     return (
//       <div>
//         <div>
//           <input ref={this.textInputRef} />
//           <button onClick={() => this.focusInput()}>focus input</button>
//         </div>
//         <div>
//           <button onClick={() => this.show100()}>show100</button>
//           <MyClassComponent ref={this.myComponentRef} />
//         </div>
//       </div>
//     );
//   }
// }

const ForwardRefComponent = React.forwardRef((props, ref) => {
  return <input ref={ref} value="ForwardRefFunctionComponent" />;
});

// console.log(ForwardRefComponent);

function FunctionComponent(props) {
  let forwardRef = React.createRef();
  let classRef = React.createRef();
  let elementRef = React.createRef();

  const changeInput = () => {
    forwardRef.current.value = "ForwardRef ...";
    classRef.current.updateShowText("100");
    elementRef.current.value = "...";
  };

  return (
    <div>
      <ForwardRefComponent ref={forwardRef} />
      <br />
      <input ref={elementRef} />
      <br />
      <input type="button" onClick={changeInput} value="点击加省略号" />
      <br />
      <MyClassComponent ref={classRef} />
    </div>
  );
}

const element = <FunctionComponent />;

console.log(element);

ReactDOM.render(element, document.getElementById("root"));
