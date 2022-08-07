const solc = require("solc");
const fs = require("fs");

const Roullete = fs.readFileSync("./contracts/Roullete.sol", "utf-8");
const WarGame = fs.readFileSync("./contracts/WarGame.sol", "utf-8");

var input = {
  language: "Solidity",
  sources: {
    "Roullete.sol": {
      content: Roullete,
    },
    "WarGame.sol": {
      content: WarGame,
    },
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["*"],
      },
    },
  },
};

module.exports = {
  Roullete: {
    abi: JSON.parse(solc.compile(JSON.stringify(input)))["contracts"][
      "Roullete.sol"
    ]["Roullete"].abi,
    bytecode: JSON.parse(solc.compile(JSON.stringify(input)))["contracts"][
      "Roullete.sol"
    ]["Roullete"].evm.bytecode.object,
  },
  WarGame: {
    abi: JSON.parse(solc.compile(JSON.stringify(input)))["contracts"][
      "WarGame.sol"
    ]["WarGame"].abi,
    bytecode: JSON.parse(solc.compile(JSON.stringify(input)))["contracts"][
      "WarGame.sol"
    ]["WarGame"].evm.bytecode.object,
  },
};
