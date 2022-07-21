import web3 from "./web3";
const contractsData = require("../../contractsDeployed.json");

const contracts = {};

for (const x in contractsData) {
  contracts[x] = new web3.eth.Contract(
    contractsData[x].abi,
    contractsData[x].address
  );
}

export default contracts;
