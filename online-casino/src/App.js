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

const roullete = new web3.eth.Contract(
  contracts.Roullete.abi,
  contracts.Roullete.address
);

function App() {
  const [state, setState] = useState({});

  useEffect(() => {
    web3.eth.getAccounts((err, accounts) => {
      if (err) console.log(err.message);
      else
        setState({
          numb: 20,
          prize: 0,
          account: accounts[0],
          showWheel: false,
          gameIdx: -1,
          playerCount: 0,
        });
    });

    roullete.events.gameCreated((err, data) => {
      if (err) console.log(err.message);
      else {
        const gameData = data.returnValues;

        setState((state) => {
          if (state.gameIdx === -1) {
            return {
              ...state,
              numb: gameData.numb,
              prize: gameData.prize,
              showWheel: true,
              gameIdx: gameData.gameIdx,
            };
          } else return state;
        });
      }
    });

    roullete.events.playerJoined((err, data) => {
      if (err) console.log(err.message);
      else {
        const gameData = data.returnValues;

        setState((state) => {
          if (state.gameIdx === gameData.gameIdx || state.gameIdx === -1)
            return {
              ...state,
              numb: gameData.numb,
              prize: gameData.prize,
              showWheel: true,
              playerCount: gameData.playerCount,
              gameIdx: gameData.gameIdx,
            };
          else return state;
        });
      }
    });

    roullete.events.gameEnded((err, data) => {
      if (err) console.log(err.message);
      else {
        const gameData = data.returnValues;

        setState((state) => {
          if (state.gameIdx === gameData.gameIdx) {
            return {
              ...state,
              numb: 20,
              prize: 0,
              showWheel: false,
              gameIdx: -1,
              playerCount: 0,
            };
          } else return state;
        });
      }
    });
  }, []);

  const onCreateGame = async () => {
    try {
      const pz = Math.floor(Math.random() * state.numb);
      await roullete.methods.createGame(state.numb, pz).send({
        from: state.account,
        gas: 200000,
      });
      console.log("Game Created");
    } catch (e) {
      console.log(e);
      console.log(e.message);
    }
  };

  const onJoinGame = async () => {
    try {
      await roullete.methods.joinGame().send({
        from: state.account,
        gas: 200000,
        value: web3.utils.toWei("0.00002", "ether"),
      });
      console.log("Game Joined");
    } catch (e) {
      console.log(e.message);
    }
  };

  const onCloseGame = async () => {
    try {
      await roullete.methods.endGame().send({
        from: state.account,
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
      {state.showWheel && (
        <CreateRoulleteGame numbers={state.numb} prizeNumber={state.prize} />
      )}
    </Container>
  );
}

export default App;
