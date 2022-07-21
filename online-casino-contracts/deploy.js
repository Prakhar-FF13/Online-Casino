const dotenv = require("dotenv");
dotenv.config();
const HDWalletProvider = require("@truffle/hdwallet-provider"),
  Web3 = require("web3"),
  contracts = require("./compile"),
  provider = new HDWalletProvider(process.env.CODE, process.env.LINK),
  web3 = new Web3(provider),
  fs = require("fs");

async function deploy() {
  const fetchedAccounts = await web3.eth.getAccounts();
  const contractsDeployed = {};
  for (x in contracts) {
    result = await new web3.eth.Contract(contracts[x].abi)
      .deploy({
        data: "0x" + contracts[x].bytecode,
      })
      .send({ from: fetchedAccounts[0], gas: 2000000 });

    contractsDeployed[x] = {
      address: result.options.address,
      abi: contracts[x].abi,
    };
  }
  fs.writeFileSync(
    "../contractsDeployed.json",
    JSON.stringify(contractsDeployed, null, 2)
  );
  provider.engine.stop();
}
deploy();
