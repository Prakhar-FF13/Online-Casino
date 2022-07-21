import RoulleteWheel from "./RoulleteWheel";
import web3 from "./web3";

function App() {
  console.log(web3.version);
  return (
    <div>
      <RoulleteWheel />
    </div>
  );
}

export default App;
