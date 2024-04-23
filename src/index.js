import ReactDOM from "./react-dom";
import React, { useState, useCallback, useMemo } from "./react";

const MemoFunction = React.memo(function Child({ data, handleClick }) {
  console.log("Child component");
  return <button onClick={handleClick}>Age: {data.age}</button>;
});

function App() {
  const [name, setName] = useState("cjl");
  const [age, setAge] = useState(30);

  let data = useMemo(() => ({ age }), [age]);

  const handleClick = useCallback(() => {
    setAge(age + 1);
  }, [age]);

  console.log("App Component");

  return (
    <div>
      <input value={name} onInput={(e) => setName(e.target.value)} />
      <MemoFunction data={data} handleClick={handleClick} />
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
