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
      .send({ from: accounts[0], gas: 3000000 });

    assert.ok(roullete["_address"]);
  });

  describe("Game Creation", async () => {
    it("Should create a new game", async () => {
      await roullete.methods.createGame(10, 3).send({
        from: accounts[0],
        gas: 300000,
      });

      const game = await roullete.methods.fetchGame().call();
      assert.equal(accounts[0], game[0]);
      assert.equal(gameState.STARTED, game.state);
    });
  });

  describe("Game Number Chosen", async () => {
    it("Should correctly choose the number for a joined game", async () => {
      await roullete.methods.createGame(10, 3).send({
        from: accounts[0],
        gas: 300000,
      });

      await roullete.methods.joinGame().send({
        from: accounts[1],
        gas: 300000,
        value: web3.utils.toWei("0.00002", "ether"),
      });
      try {
        await roullete.methods.chooseNumber(0, 5).send({
          from: accounts[1],
          gas: 300000,
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
        gas: 300000,
      });

      await roullete.methods.endGame().send({
        from: accounts[0],
        gas: 300000,
      });
    });

    it("Should not do anything if game has already ended or has not started", async () => {
      await roullete.methods.createGame(10, 3).send({
        from: accounts[0],
        gas: 300000,
      });

      await roullete.methods.endGame().send({
        from: accounts[0],
        gas: 300000,
      });

      try {
        await roullete.methods.endGame().send({
          from: accounts[0],
          gas: 300000,
        });

        throw new Error("Game ended twice");
      } catch (e) {
        assert.notEqual(e.message, "Game ended twice");
      }
    });

    it("Should not allow anyone other than game creator to end the game", async () => {
      await roullete.methods.createGame(10, 3).send({
        from: accounts[0],
        gas: 300000,
      });

      try {
        await roullete.methods.endGame().send({
          from: accounts[1],
          gas: 300000,
        });

        throw new Error("Game ended by someone other than the owner");
      } catch (e) {
        assert.notEqual(
          e.message,
          "Game ended by someone other than the owner"
        );
      }
    });

    it("Should send the money to the winner after the game ends", async () => {
      await roullete.methods.createGame(10, 3).send({
        from: accounts[0],
        gas: 300000,
      });

      const initialWei = await web3.eth.getBalance(accounts[1]);

      await Promise.all([
        roullete.methods.joinGame().send({
          from: accounts[1],
          gas: 300000,
          value: web3.utils.toWei("0.2", "ether"),
        }),
        roullete.methods.chooseNumber(0, 3).send({
          from: accounts[1],
          gas: 300000,
        }),
        roullete.methods.joinGame().send({
          from: accounts[2],
          gas: 300000,
          value: web3.utils.toWei("0.2", "ether"),
        }),
        roullete.methods.chooseNumber(0, 5).send({
          from: accounts[2],
          gas: 300000,
        }),
      ]);

      await roullete.methods.endGame().send({
        from: accounts[0],
        gas: 300000,
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
          gas: 300000,
          value: web3.utils.toWei("0.00002", "ether"),
        });

        throw new Error("Game joined when no game exists");
      } catch (e) {
        assert.notEqual(e.message, "Game joined when no game exists");
      }
    });

    it("Should not allow joining the game if minimum bid is not met", async () => {
      await roullete.methods.createGame(10, 3).send({
        from: accounts[0],
        gas: 300000,
      });

      try {
        await roullete.methods.joinGame().send({
          from: accounts[1],
          gas: 300000,
          value: web3.utils.toWei("0.000001", "ether"),
        });

        throw new Error("Game joined when minimum bid not met");
      } catch (e) {
        assert.notEqual(e.message, "Game joined when minimum bid not met");
      }
    });

    it("Should join the game if a game is available", async () => {
      await roullete.methods.createGame(10, 3).send({
        from: accounts[1],
        gas: 300000,
      });

      await roullete.methods.joinGame().send({
        from: accounts[0],
        gas: 300000,
        value: web3.utils.toWei("0.00002", "ether"),
      });

      const game = await roullete.methods
        .fetchGame()
        .call({ from: accounts[1] });
      assert.equal(accounts[0], game[5][0]);
    });

    it("Should not allow a creator to join his own game", async () => {
      await roullete.methods.createGame(10, 3).send({
        from: accounts[0],
        gas: 300000,
      });

      try {
        await roullete.methods.joinGame().send({
          from: accounts[0],
          gas: 300000,
          value: web3.utils.toWei("0.000002", "ether"),
        });

        throw new Error("Creator allowed to join his own game");
      } catch (e) {
        assert.notEqual(e.message, "Creator allowed to join his own game");
      }
    });

    it("Should allow multiple players to join", async () => {
      try {
        await roullete.methods.createGame(10, 3).send({
          from: accounts[0],
          gas: 300000,
        });

        await roullete.methods.joinGame().send({
          from: accounts[1],
          gas: 300000,
          value: web3.utils.toWei("0.00002", "ether"),
        });

        await roullete.methods.joinGame().send({
          from: accounts[2],
          gas: 300000,
          value: web3.utils.toWei("0.00002", "ether"),
        });
      } catch (e) {
        throw new Error("Multiple players could not join");
      }
    });
  });
});

describe("Casino War", () => {
  let accounts, war;
  const gameState = {
    NOTSTARTED: 0,
    STARTED: 1,
    ENDED: 2,
  };

  beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    war = await new web3.eth.Contract(contracts.WarGame.abi)
      .deploy({
        data: "0x" + contracts.WarGame.bytecode,
      })
      .send({ from: accounts[0], gas: 5000000 });

    assert.ok(war["_address"]);
  });

  describe("Game Creation", async () => {
    it("Should create the game", async () => {
      await war.methods.createGame().send({
        from: accounts[0],
        gas: 5000000,
        value: web3.utils.toWei("0.001")
      });

      const res = await war.methods.fetchCreatedGame().call({
        from: accounts[0],
        gas: 2000000,
      });

      assert.equal(gameState.STARTED, res[4]);
    });

    it("Should not create the game if minimum bid not specified", async () => {
      try {
        await war.methods.createGame().send({
          from: accounts[0],
          gas: 3000000,
          value: web3.utils.toWei("0.00001")
        });
        throw new Error("Game Created");
      } catch (e) {
        assert.strictEqual("Dealer must provide at-least 0.001 ethers to begin the game",
            e.results[e.hashes[0]].reason);
      }
    });

    it("Should return NOTSTARTED as state if game is not created", async () => {
      const res = await war.methods
        .fetchCreatedGame()
        .call({ from: accounts[0], gas: 2000000 });

      assert.equal(gameState.NOTSTARTED, res[4]);
    });

    it("Should not create a new game if a game is already running", async () => {
      await war.methods.createGame().send({
        from: accounts[0],
        gas: 2000000,
        value: web3.utils.toWei("0.001")
      });

      let res = await war.methods.fetchCreatedGame().call({
        from: accounts[0],
        gas: 2000000,
      });

      const gameIdx = res[0];

      await war.methods.createGame().send({
        from: accounts[0],
        gas: 2000000,
        value: web3.utils.toWei("0.001")
      });

      res = await war.methods.fetchCreatedGame().call({
        from: accounts[0],
        gas: 2000000,
      });

      assert.equal(gameIdx, res[0]);
    });
  });

  describe("Game Joining", async () => {
    it("Should not join the game if no game is available", async () => {
      try {
        await war.methods.joinGame().send({
          from: accounts[0],
          gas: 200000,
        });
      } catch (e) {
        assert.equal("No games available", e.results[e.hashes[0]].reason);
      }
    });

    it("Should join the game if game is available", async () => {
      await war.methods.createGame().send({
        from: accounts[0],
        gas: 200000,
        value: web3.utils.toWei("0.001")
      });

      await war.methods.joinGame().send({
        from: accounts[1],
        gas: 200000,
      });

      let res = await war.methods.fetchCreatedGame().call({
        from: accounts[0],
        gas: 200000,
      });

      assert.equal(accounts[1], res[2][0]);

      res = await war.methods.fetchJoinedGame().call({
        from: accounts[1],
        gas: 200000,
      });

      assert.equal(accounts[0], res[1]);
    });

    it("Should not join a new game if previously joined game is already running", async () => {
      await war.methods.createGame().send({
        from: accounts[0],
        gas: 200000,
        value: web3.utils.toWei("0.001")
      });

      await war.methods.joinGame().send({
        from: accounts[1],
        gas: 200000,
      });

      let res = await war.methods.fetchJoinedGame().call({
        from: accounts[1],
        gas: 200000,
      });
      const gameCreator = res[1];

      await war.methods.createGame().send({
        from: accounts[2],
        gas: 200000,
        value: web3.utils.toWei("0.001")
      });

      await war.methods.createGame().send({
        from: accounts[3],
        gas: 200000,
        value: web3.utils.toWei("0.001")
      });

      await war.methods.createGame().send({
        from: accounts[4],
        gas: 200000,
        value: web3.utils.toWei("0.001")
      });

      await war.methods.joinGame().send({
        from: accounts[1],
        gas: 200000,
      });

      res = await war.methods.fetchJoinedGame().call({
        from: accounts[1],
        gas: 200000,
      });

      assert.equal(gameCreator, res[1]);
    });

    it("Should not allow a game dealer to participate as a player", async () => {
      await war.methods.createGame().send({
        from: accounts[0],
        gas: 200000,
        value: web3.utils.toWei("0.001")
      });

      try {
        await war.methods.joinGame().send({
          from: accounts[0],
          gas: 200000,
        });
      } catch (e) {
        assert.equal(
          "Could not find a game you could join",
          e.results[e.hashes[0]].reason
        );
      }
    });

    it("Should allow multiple players to join the game", async () => {
      await war.methods.createGame().send({
        from: accounts[0],
        gas: 200000,
        value: web3.utils.toWei("0.001")
      });

      await war.methods.joinGame().send({
        from: accounts[1],
        gas: 200000,
      });

      await war.methods.joinGame().send({
        from: accounts[2],
        gas: 200000,
      });

      await war.methods.joinGame().send({
        from: accounts[3],
        gas: 200000,
      });

      const res = await war.methods.fetchCreatedGame().call({
        from: accounts[0],
        gas: 200000,
      });

      assert.equal(3, res[2].length);
      assert.equal(accounts[1], res[2][0]);
      assert.equal(accounts[2], res[2][1]);
      assert.equal(accounts[3], res[2][2]);
    });
  });

  describe("Player Bidding", async () => {
    it("Should not allow bidding if bid is too low", async () => {
      try {
        await war.methods.createGame().send({
          from: accounts[0],
          gas: 200000,
          value: web3.utils.toWei("0.001")
        });

        await war.methods.joinGame().send({
          from: accounts[1],
          gas: 200000,
        });

        await war.methods.playerBid().send({
          from: accounts[1],
          gas: 200000,
          value: web3.utils.toWei("0.00000001"),
        });
      } catch (e) {
        assert.equal("Bid too low", e.results[e.hashes[0]].reason);
      }
    });

    it("Should not allow bidding if bid is too high", async () => {
      try {
        await war.methods.createGame().send({
          from: accounts[0],
          gas: 200000,
          value: web3.utils.toWei("0.001")
        });

        await war.methods.joinGame().send({
          from: accounts[1],
          gas: 200000,
        });

        await war.methods.playerBid().send({
          from: accounts[1],
          gas: 200000,
          value: web3.utils.toWei("0.006"),
        });
      } catch (e) {
        assert.equal("Bid too high", e.results[e.hashes[0]].reason);
      }
    });

    it("Should not allow dealer to bid", async () => {
      try {
        await war.methods.createGame().send({
          from: accounts[0],
          gas: 200000,
          value: web3.utils.toWei("0.001")
        });

        await war.methods.playerBid().send({
          from: accounts[0],
          gas: 200000,
          value: web3.utils.toWei("0.0001"),
        });
      } catch (e) {
        assert.equal(
          "Join a game to start bidding",
          e.results[e.hashes[0]].reason
        );
      }
    });

    it("Should not allow a player to bid if a game hasn't been joined", async () => {
      try {
        await war.methods.createGame().send({
          from: accounts[0],
          gas: 200000,
          value: web3.utils.toWei("0.001")
        });

        await war.methods.playerBid().send({
          from: accounts[1],
          gas: 200000,
          value: web3.utils.toWei("0.0001"),
        });
      } catch (e) {
        assert.equal(
          "Join a game to start bidding",
          e.results[e.hashes[0]].reason
        );
      }
    });

    it("Should allow a player to bid in the joined game", async () => {
      await war.methods.createGame().send({
        from: accounts[0],
        gas: 200000,
        value: web3.utils.toWei("0.001")
      });

      await war.methods.joinGame().send({
        from: accounts[1],
        gas: 200000,
      });

      await war.methods.playerBid().send({
        from: accounts[1],
        gas: 200000,
        value: web3.utils.toWei("0.0001"),
      });

      const res = await war.methods.fetchCreatedGame().call({
        from: accounts[0],
        gas:200000
      });

      assert.strictEqual(web3.utils.toWei("0.0001"),res[3][0]);
    });
  });

  describe("Game Round", async () => {
    it("Should only play the round if game has started", async () => {
      try {
        await war.methods.playRound(["Ac"]).send({
          from: accounts[0],
          gas: 200000
        });
      } catch (e) {
        assert.strictEqual("Start a game to start the round", e.results[e.hashes[0]].reason);
      }
    })

    it("Dealer should win if his card is better than the player's card", async () => {
      await war.methods.createGame().send({
        from: accounts[0],
        gas: 200000,
        value: web3.utils.toWei("0.001")
      });

      await war.methods.joinGame().send({
        from: accounts[1],
        gas: 200000
      });

      await war.methods.playerBid().send({
        from: accounts[1],
        gas: 2000000,
        value: web3.utils.toWei("0.0002")
      });

      const prevBalance = BigInt(String(await web3.eth.getBalance(accounts[0])));

      await war.methods.playRound(["Kc", "Ac"]).send({
        from: accounts[0],
        gas: 200000
      });

      const newBalance = BigInt(String(await web3.eth.getBalance(accounts[0])));

      assert(newBalance > prevBalance);
    });

    it("Player should win if his card is better than the dealer's card", async () => {
      await war.methods.createGame().send({
        from: accounts[0],
        gas: 200000,
        value: web3.utils.toWei("0.001")
      });

      await war.methods.joinGame().send({
        from: accounts[1],
        gas: 200000
      });

      await war.methods.playerBid().send({
        from: accounts[1],
        gas: 200000,
        value: web3.utils.toWei("0.0002")
      });

      const prevBalance = await web3.eth.getBalance(accounts[1]);

      await war.methods.playRound(["Ac", "Kc"]).send({
        from: accounts[0],
        gas: 200000
      });

      const newBalance = await web3.eth.getBalance(accounts[1]);

      const x = BigInt(prevBalance) + BigInt(String(web3.utils.toWei("0.00039")));

      assert(BigInt(newBalance) >= x);
    });

    it("All players should win if their cards are better than dealers cards", async () => {
      await war.methods.createGame().send({
        from: accounts[0],
        gas: 200000,
        value: web3.utils.toWei("0.001")
      });

      await war.methods.joinGame().send({
        from: accounts[1],
        gas: 200000
      });

      await war.methods.playerBid().send({
        from: accounts[1],
        gas: 200000,
        value: web3.utils.toWei("0.0002")
      });

      const prevBalance1 = await web3.eth.getBalance(accounts[1]);

      await war.methods.joinGame().send({
        from: accounts[2],
        gas: 200000
      });

      await war.methods.playerBid().send({
        from: accounts[2],
        gas: 200000,
        value: web3.utils.toWei("0.0002")
      });

      const prevBalance2 = await web3.eth.getBalance(accounts[2]);

      await war.methods.joinGame().send({
        from: accounts[3],
        gas: 200000
      });

      await war.methods.playerBid().send({
        from: accounts[3],
        gas: 200000,
        value: web3.utils.toWei("0.0002")
      });

      const prevBalance3 = await web3.eth.getBalance(accounts[3]);

      await war.methods.playRound(["Ac", "Ak", "Ad", "Kc"]).send({
        from: accounts[0],
        gas: 300000
      });

      const newBalance1 = await web3.eth.getBalance(accounts[1]);
      const newBalance2 = await web3.eth.getBalance(accounts[2]);
      const newBalance3 = await web3.eth.getBalance(accounts[3]);

      assert(newBalance1 > prevBalance1);
      assert(newBalance2 > prevBalance2);
      assert(newBalance3 > prevBalance3);
    });

    it("Dealer should win if his card is better than all the players cards", async () => {
      await war.methods.createGame().send({
        from: accounts[0],
        gas: 200000,
        value: web3.utils.toWei("0.001")
      });

      await war.methods.joinGame().send({
        from: accounts[1],
        gas: 200000
      });

      await war.methods.playerBid().send({
        from: accounts[1],
        gas: 200000,
        value: web3.utils.toWei("0.0002")
      });

      await war.methods.joinGame().send({
        from: accounts[2],
        gas: 200000
      });

      await war.methods.playerBid().send({
        from: accounts[2],
        gas: 200000,
        value: web3.utils.toWei("0.0002")
      });

      await war.methods.joinGame().send({
        from: accounts[3],
        gas: 200000
      });

      await war.methods.playerBid().send({
        from: accounts[3],
        gas: 200000,
        value: web3.utils.toWei("0.0002")
      });

      const prevBalance = BigInt(String(await web3.eth.getBalance(accounts[0])));

      await war.methods.playRound(["Kc", "Kk", "Kd", "Ac"]).send({
        from: accounts[0],
        gas: 200000
      });

      const newBalance = BigInt(String(await  web3.eth.getBalance(accounts[0])));

      assert(newBalance > prevBalance);
    });

    it("It should be possible for some players to win and other players to lose against the dealer in the same game", async () => {
      await war.methods.createGame().send({
        from: accounts[0],
        gas: 200000,
        value: web3.utils.toWei("0.001")
      });

      await war.methods.joinGame().send({
        from: accounts[1],
        gas: 200000
      });

      await war.methods.playerBid().send({
        from: accounts[1],
        gas: 200000,
        value: web3.utils.toWei("0.0002")
      });

      await war.methods.joinGame().send({
        from: accounts[2],
        gas: 200000
      });

      await war.methods.playerBid().send({
        from: accounts[2],
        gas: 200000,
        value: web3.utils.toWei("0.0002")
      });

      const prevBalance1 = await web3.eth.getBalance(accounts[1]);
      const prevBalance2 = await web3.eth.getBalance(accounts[2]);

      await war.methods.playRound(["2c", "6d", "4c"]).send({
        from: accounts[0],
        gas: 200000
      });

      const newBalance1 = await web3.eth.getBalance(accounts[1]);
      const newBalance2 = await web3.eth.getBalance(accounts[2]);

      assert(newBalance1 === prevBalance1);
      assert(newBalance2 > prevBalance2);
    });
  });

  describe("Game End", async () => {
    it("Should only end the game if the game has started", async () => {
      try {
        await war.methods.endGame().send({
          from: accounts[0],
          gas: 200000,
        });

        throw new Error("Game ended");
      } catch (e) {
        assert.strictEqual("No game exists", e.results[e.hashes[0]].reason);
      }
    });

    it("Should return money bid by the players and remaining money to dealer if game ends", async () => {
      await war.methods.createGame().send({
        from: accounts[0],
        gas:200000,
        value: web3.utils.toWei("0.001")
      });

      await war.methods.joinGame().send({
        from: accounts[1],
        gas: 200000
      });

      await war.methods.joinGame().send({
        from: accounts[2],
        gas: 200000
      });

      await war.methods.playerBid().send({
        from: accounts[1],
        gas: 2000000,
        value: web3.utils.toWei("0.0001")
      });

      await war.methods.playerBid().send({
        from: accounts[2],
        gas: 2000000,
        value: web3.utils.toWei("0.0001")
      });

      const prevBalance0 = await web3.eth.getBalance(accounts[0]);
      const prevBalance1 = await web3.eth.getBalance(accounts[1]);
      const prevBalance2 = await web3.eth.getBalance(accounts[2]);

      await war.methods.endGame().send({
        from: accounts[0],
        gas: 200000
      });

      const newBalance0 = await web3.eth.getBalance(accounts[0]);
      const newBalance1 = await web3.eth.getBalance(accounts[1]);
      const newBalance2 = await web3.eth.getBalance(accounts[2]);

      assert(newBalance0 > prevBalance0);
      assert(newBalance1 > prevBalance1);
      assert(newBalance2 > prevBalance2);
    });
  });
});
