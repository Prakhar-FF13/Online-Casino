import { useState, useEffect } from "react";
import { RiseLoader } from "react-spinners";
import styled from "styled-components";
import CreateRoulleteGame from "./sections/RoulleteWheel/CreateRoulleteGame";
import web3 from "./utils/web3";

const contracts = require("./utils/contractsDeployed.json");

const override = {
  display: "block",
  margin: "0 auto",
  borderColor: "red",
};

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

const GameContainer = styled.div`
  display: flex;
  margin: 32px;
`;

const BidNumber = styled.div`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const roullete = new web3.eth.Contract(
  contracts.Roullete.abi,
  contracts.Roullete.address
);

function App() {
  const [state, setState] = useState({});
  const [chosen, setChosen] = useState("");
  const [bid, setBid] = useState("0.00000");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    web3.eth.getAccounts((err, accounts) => {
      if (err) console.log(err.message);
      else {
        setState({
          numb: 20,
          prize: 0,
          account: accounts[0],
          showWheel: false,
          gameIdx: -1,
          playerCount: 0,
          showSpinner: false,
          createdBy: null,
        });
      }
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
              createdBy: gameData.createdBy,
            };
          } else return state;
        });

        console.log("Game Created");
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

        console.log("Player Joined");
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
              showSpinner: false,
              gameIdx: -1,
              playerCount: 0,
              createdBy: null,
            };
          } else return state;
        });

        console.log("Game Ended");
      }
    });
  }, []);

  const onCreateGame = async () => {
    try {
      setLoading(true);
      const pz = Math.floor(Math.random() * state.numb);
      await roullete.methods.createGame(state.numb, pz).send({
        from: state.account,
        gas: 200000,
      });
    } catch (e) {
      console.log(e.receipt);
    } finally {
      setLoading(false);
    }
  };

  const onJoinGame = async () => {
    try {
      setLoading(true);
      await roullete.methods.joinGame().send({
        from: state.account,
        gas: 300000,
        value: web3.utils.toWei(bid, "ether"),
      });
      console.log("Game Joined");
    } catch (e) {
      console.log(e.receipt);
    } finally {
      setLoading(false);
    }
  };

  const onChooseNumber = async () => {
    try {
      setLoading(true);
      await roullete.methods
        .chooseNumber(state.gameIdx, parseInt(chosen))
        .send({
          from: state.account,
          gas: 200000,
        });
      console.log("Number Chosen");
    } catch (e) {
      console.log(e.receipt);
    } finally {
      setLoading(false);
    }
  };

  const onCloseGame = async () => {
    try {
      setLoading(true);
      await roullete.methods.endGame().send({
        from: state.account,
        gas: 200000,
      });
    } catch (e) {
      console.log(e.receipt);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <ButtonContainer>
        <Button
          disabled={state.showWheel || state.showSpinner}
          onClick={() => {
            onCreateGame();
          }}
        >
          Create Game
        </Button>
        <div style={{ display: "flex", flex: 2 }}>
          <input
            type="number"
            min={1}
            max={20}
            value={bid}
            style={{ flex: 1 }}
            onChange={(e) => {
              const x = e.target.value;
              let newx = "";
              for (let i = 0; i < x.length; i++) {
                if ((x[i] >= "0" && x[i] <= "9") || x[i] === ".") newx += x[i];
              }
              setBid(newx);
            }}
          />
          <Button
            style={{ flex: 2 }}
            onClick={() => {
              onJoinGame();
            }}
          >
            Join Game
          </Button>
        </div>
        {state.account === state.createdBy && (
          <Button
            onClick={() => {
              onCloseGame();
            }}
          >
            Close Game
          </Button>
        )}
      </ButtonContainer>
      <GameContainer>
        <RiseLoader
          loading={loading}
          cssOverride={override}
          size={15}
          margin={16}
        />
        {!loading && state.showWheel && state.createdBy !== state.account && (
          <BidNumber>
            <input
              type="number"
              min={1}
              max={20}
              value={chosen}
              onChange={(e) => {
                const x = e.target.value;
                let newX = "";
                for (let i = 0; i < x.length; i++) {
                  if (x[i] >= "0" && x[i] <= "9") newX += x[i];
                }
                setChosen(newX);
              }}
            />
            <button
              onClick={() => {
                onChooseNumber();
              }}
            >
              Choose Number to Bid On
            </button>
          </BidNumber>
        )}
        {!loading && state.showWheel && (
          <CreateRoulleteGame
            numbers={state.numb}
            prizeNumber={state.prize}
            style={{
              flex: 1,
              "align-items": "center",
              "justify-content": "center",
            }}
          />
        )}
      </GameContainer>
    </Container>
  );
}

export default App;
