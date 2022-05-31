import { useState } from 'react'

const FunctionalComponent = () => {
  const [count, setCount] = useState(0);

  //increase counter
  const increase = () => {
    setCount(count => count + 1);
  };

  //decrease counter
  const decrease = () => {
    setCount(count => count - 1);
  };

  //reset counter
  const reset = () =>{
    setCount(0)
  }

  return (
    <div className='functional-component'>
      <h2>I'm Functional Component</h2>
      <span>{count}</span>
      <div>
        <button onClick={increase}>+</button>
        <button onClick={decrease}>-</button>
        <button onClick={reset}>Reset</button>
      </div>
    </div>
  )
};

export default FunctionalComponent;
