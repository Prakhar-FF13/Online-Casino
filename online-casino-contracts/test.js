const Web3 = require("web3"),
  ganache = require("ganache-cli"),
  web3 = new Web3(ganache.provider()),
  contracts = require("./compile"),
  assert = require("assert");

describe("Deploying the contarct", () => {
  it("Should deploy the contract", async () => {
    const accounts = await web3.eth.getAccounts();
    const result = await new web3.eth.Contract(contracts.Roullete.abi)
      .deploy({
        data: "0x" + contracts.Roullete.bytecode,
      })
      .send({ from: accounts[0], gas: 2000000 });

    assert.ok(result["_address"]);
  });

  describe("Game Functionality", async () => {
    let contract;
    beforeEach(async () => {
      const accounts = await web3.eth.getAccounts();
      const result = await new web3.eth.Contract(contracts.Roullete.abi)
        .deploy({
          data: "0x" + contracts.Roullete.bytecode,
        })
        .send({ from: accounts[0], gas: 2000000 });

      contract = result;
    });
  });
});
