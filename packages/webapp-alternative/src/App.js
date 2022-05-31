import logo from './logo.svg';
import './App.css';
import EsClassComponent from './components/EsClassComponent'
import FunctionalComponent from './components/FunctionalComponent'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
      </header>
      <main>
        <h1>Hello World!</h1>
        <EsClassComponent />
        <FunctionalComponent />
      </main>
    </div>
  );
}

export default App;
