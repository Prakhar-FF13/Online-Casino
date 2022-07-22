const Web3 = require("web3"),
  ganache = require("ganache-cli"),
  web3 = new Web3(ganache.provider()),
  contracts = require("./compile"),
  assert = require("assert");

describe("Roullete Wheel", () => {
  let accounts, roullete;
  const gameState = {
    NOTSTARTED: 0,
    STARTED: 1,
    ENDED: 2,
  };

  beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    roullete = await new web3.eth.Contract(contracts.Roullete.abi)
      .deploy({
        data: "0x" + contracts.Roullete.bytecode,
      })
      .send({ from: accounts[0], gas: 2000000 });

    assert.ok(roullete["_address"]);
  });

  describe("Game Creation", async () => {
    it("Should create a new game", async () => {
      await roullete.methods.createGame(10, 3).send({
        from: accounts[0],
        gas: 200000,
      });

      const game = await roullete.methods.fetchGame().call();
      assert.equal(accounts[0], game[0]);
      assert.equal(gameState.STARTED, game.state);
    });

    it("Should not create a new game if a game is already running", async () => {
      await roullete.methods.createGame(10, 3).send({
        from: accounts[0],
        gas: 200000,
      });

      try {
        await roullete.methods.createGame(10, 3).send({
          from: accounts[0],
          gas: 200000,
        });

        throw new Error("Game created twice");
      } catch (e) {
        assert.ok(e);
      }
    });
  });

  describe("Game Number Chosen", async () => {
    it("Should correctly choose the number for a joined game", async () => {
      await roullete.methods.createGame(10, 3).send({
        from: accounts[0],
        gas: 200000,
      });

      await roullete.methods.joinGame().send({
        from: accounts[1],
        gas: 200000,
        value: web3.utils.toWei("0.00002", "ether"),
      });
      try {
        await roullete.methods.chooseNumber(0, 5).send({
          from: accounts[1],
          gas: 200000,
        });

        assert(true);
      } catch (e) {
        throw new Error("Could not choose the number");
      }
    });
  });

  describe("Game Termination", async () => {
    it("Should end the game if a game is running", async () => {
      await roullete.methods.createGame(10, 3).send({
        from: accounts[0],
        gas: 200000,
      });

      await roullete.methods.endGame().send({
        from: accounts[0],
        gas: 200000,
      });

      const game = await roullete.methods.fetchGame().call();
      assert.equal(gameState.ENDED, game[6]);
    });

    it("Should not do anything if game has already ended or has not started", async () => {
      await roullete.methods.createGame(10, 3).send({
        from: accounts[0],
        gas: 200000,
      });

      await roullete.methods.endGame().send({
        from: accounts[0],
        gas: 200000,
      });

      try {
        await roullete.methods.endGame().send({
          from: accounts[0],
          gas: 200000,
        });

        throw new Error("Game ended twice");
      } catch (e) {
        assert.ok(e);
      }
    });

    it("Should not allow anyone other than game creator to end the game", async () => {
      await roullete.methods.createGame(10, 3).send({
        from: accounts[0],
        gas: 200000,
      });

      try {
        await roullete.methods.endGame().send({
          from: accounts[1],
          gas: 200000,
        });

        throw new Error("Game ended by someone other than the owner");
      } catch (e) {
        assert.ok(e);
      }
    });

    it("Should send the money to the winner after the game ends", async () => {
      await roullete.methods.createGame(10, 3).send({
        from: accounts[0],
        gas: 200000,
      });

      const initialWei = await web3.eth.getBalance(accounts[1]);

      await Promise.all([
        roullete.methods.joinGame().send({
          from: accounts[1],
          gas: 200000,
          value: web3.utils.toWei("0.2", "ether"),
        }),
        roullete.methods.chooseNumber(0, 3).send({
          from: accounts[1],
          gas: 200000,
        }),
        roullete.methods.joinGame().send({
          from: accounts[2],
          gas: 200000,
          value: web3.utils.toWei("0.2", "ether"),
        }),
        roullete.methods.chooseNumber(0, 5).send({
          from: accounts[2],
          gas: 200000,
        }),
      ]);

      await roullete.methods.endGame().send({
        from: accounts[0],
        gas: 200000,
      });

      const finalWei = await web3.eth.getBalance(accounts[1]);

      assert(finalWei - initialWei >= web3.utils.toWei("0.19"));
    });
  });

  describe("Game Joining", async () => {
    it("Should not join if no game is available", async () => {
      try {
        await roullete.methods.joinGame().send({
          from: accounts[0],
          gas: 200000,
          value: web3.utils.toWei("0.00002", "ether"),
        });

        throw new Error("Game joined when no game exists");
      } catch (e) {
        assert.ok(e);
      }
    });

    it("Should not allow joining the game if minimum bid is not met", async () => {
      await roullete.methods.createGame(10, 3).send({
        from: accounts[0],
        gas: 200000,
      });

      try {
        await roullete.methods.joinGame().send({
          from: accounts[1],
          gas: 200000,
          value: web3.utils.toWei("0.000001", "ether"),
        });

        throw new Error("Game joined when minimum bid not met");
      } catch (e) {
        assert.ok(e);
      }
    });

    it("Should join the game if a game is available", async () => {
      await roullete.methods.createGame(10, 3).send({
        from: accounts[0],
        gas: 200000,
      });

      await roullete.methods.joinGame().send({
        from: accounts[1],
        gas: 200000,
        value: web3.utils.toWei("0.00002", "ether"),
      });

      const game = await roullete.methods.fetchGame().call();
      assert.equal(accounts[1], game[5][0]);
    });

    it("Should not allow a creator to join his own game", async () => {
      await roullete.methods.createGame(10, 3).send({
        from: accounts[0],
        gas: 200000,
      });

      try {
        await roullete.methods.joinGame().send({
          from: accounts[0],
          gas: 200000,
          value: web3.utils.toWei("0.000002", "ether"),
        });

        throw new Error("Creator allowed to join his own game");
      } catch (e) {
        assert.ok(e);
      }
    });
  });
});
