import React from 'react';

class EsClassComponent extends React.Component {
  constructor (props){
    super(props);
    this.state = {
      count: 0,
    }
    this.increase = this.increase.bind(this);
    this.decrease = this.decrease.bind(this);
  }

  increase() {
    this.setState(previousValue => ({
      count: previousValue.count + 1,
    }));
  }

  decrease() {
    this.setState(previousValue => ({
      count: previousValue.count - 1,
    }));
  }

  reset() {
    this.setState(()=> ({
      count: 0,
    }));
  }

  render() {
    return (
      <div className="es6-class-component">
        <h2>I'm ES6 Class Component</h2>
        <span>{this.state.count}</span>
        <div>
          <button onClick={this.increase}>+</button>
          <button onClick={this.decrease}>-</button>
          <button onClick={this.reset}>Reset</button>
        </div>
      </div>
    )
  };
}

export default EsClassComponent;
