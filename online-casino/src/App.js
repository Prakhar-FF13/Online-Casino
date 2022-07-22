import { useEffect } from "react";
import { useState } from "react";
import styled from "styled-components";
import CreateRoulleteGame from "./sections/RoulleteWheel/CreateRoulleteGame";
import web3 from "./utils/web3";

const contracts = require("./utils/contractsDeployed.json");

const Container = styled.div`
  margin: 0 auto;
  max-width: 1140px;
`;

const ButtonContainer = styled.div`
  display: flex;
`;

const Button = styled.button`
  background-color: #53b3ff;
  padding: 8px;
  font-weight: 600;
  border: 0px;
  margin: 4px;
  border-radius: 3px;
  flex: 1;
  cursor: pointer;
`;

function App() {
  const [prize, setPrize] = useState(0);
  const [numb, setNumb] = useState(20);
  const [account, setAccount] = useState(null);
  const [showWheel, setShowWheel] = useState(false);

  useEffect(() => {
    web3.eth.getAccounts((err, accounts) => {
      if (err) console.log(err.message);
      else setAccount(accounts[0]);
    });
  }, []);

  const roullete = new web3.eth.Contract(
    contracts.Roullete.abi,
    contracts.Roullete.address
  );

  const onCreateGame = async () => {
    try {
      const pz = Math.floor(Math.random() * numb);
      await roullete.methods.createGame(numb, prize).send({
        from: account,
        gas: 200000,
      });

      setPrize(pz);
      setShowWheel(true);
      console.log("Game Created");
    } catch (e) {
      console.log(e.message);
    }
  };

  const onJoinGame = async () => {
    try {
      await roullete.methods.joinGame().send({
        from: account,
        gas: 200000,
        value: web3.utils.toWei("0.00002", "ether"),
      });

      /*
        @TODO get the joined game data.
      */
      // const game = await roullete.methods.fetchGame().call();
      // console.log(game);
      // setNumb(game[3]);
      // setPrize(game[2]);
      // setShowWheel(true);
      console.log("Game Joined");
    } catch (e) {
      console.log(e.message);
    }
  };

  const onCloseGame = async () => {
    try {
      await roullete.methods.endGame().send({
        from: account,
        gas: 200000,
      });

      console.log("Game ended");
    } catch (e) {
      console.log(e.message);
    }
  };

  return (
    <Container>
      <ButtonContainer>
        <Button
          onClick={() => {
            onCreateGame();
          }}
        >
          Create Game
        </Button>
        <Button
          onClick={() => {
            onJoinGame();
          }}
        >
          Join Game
        </Button>
        <Button
          onClick={() => {
            onCloseGame();
          }}
        >
          Close Game
        </Button>
      </ButtonContainer>
      {showWheel && <CreateRoulleteGame numbers={numb} prizeNumber={prize} />}
    </Container>
  );
}

export default App;
