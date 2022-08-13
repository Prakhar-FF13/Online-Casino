import { useState, useEffect } from "react";
import "react-notifications-component/dist/theme.css";
import { RiseLoader } from "react-spinners";
import styled from "styled-components";
import CreateRoulleteGame from "./CreateRoulleteGame";
import web3 from "../../utils/web3";
import {Store} from "react-notifications-component";

const contracts = require("../../utils/contractsDeployed.json");

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

function RoulleteGame() {
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
          mustSpin: false,
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
          if (state.gameIdx === gameData.gameIdx || state.gameIdx === -1) {
            if (state.gameIdx !== -1)
              Store.addNotification({
                title: "Another player has joined the game",
                message: `Total players: ${gameData.playerCount}`,
                type: "success",
                insert: "top",
                container: "top-right",
                animationIn: ["animate__animated", "animate__fadeIn"],
                animationOut: ["animate__animated", "animate__fadeOut"],
                dismiss: {
                  duration: 5000,
                  onScreen: true,
                },
              });

            return {
              ...state,
              numb: gameData.numb,
              prize: gameData.prize,
              showWheel: true,
              playerCount: gameData.playerCount,
              gameIdx: gameData.gameIdx,
            };
          } else return state;
        });

        console.log("Player Joined");
      }
    });

    roullete.events.gameEnded((err, data) => {
      if (err) console.log(err.message);
      else {
        const gameData = data.returnValues;

        setTimeout(() => {
          setState((state) => {
            if (state.gameIdx === gameData.gameIdx) {
              Store.addNotification({
                title: "Game has Finished",
                message: `Winner has been paid. Winning Number - ${state.prize}`,
                type: "success",
                insert: "top",
                container: "top-right",
                animationIn: ["animate__animated", "animate__fadeIn"],
                animationOut: ["animate__animated", "animate__fadeOut"],
                dismiss: {
                  duration: 5000,
                  onScreen: true,
                },
              });

              console.log(state);

              return {
                ...state,
                numb: 20,
                prize: 0,
                showWheel: false,
                showSpinner: false,
                gameIdx: -1,
                playerCount: 0,
                createdBy: null,
                mustSpin: false,
              };
            } else return state;
          });
        }, 5000);

        setState((state) => {
          if (state.gameIdx === gameData.gameIdx) {
            console.log(state);
            return {
              ...state,
              showWheel: true,
              mustSpin: true,
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
      const pz = Math.floor(Math.random() * state.numb) + 1;
      await roullete.methods.createGame(state.numb, pz).send({
        from: state.account,
        gas: 200000,
      });

      Store.addNotification({
        title: "Game Created",
        type: "success",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: {
          duration: 5000,
          onScreen: true,
        },
      });
    } catch (e) {
      console.log(e.receipt);
      Store.addNotification({
        title: "Something went wrong while creating the contract.",
        message:
          "Possible reasons - 1. MetaMask not connected 2. Game already running",
        type: "danger",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: {
          duration: 5000,
          onScreen: true,
        },
      });
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
      Store.addNotification({
        title: "Something went wrong while joining the game.",
        message: "Possible reasons - 1. Bid too low 2. Games not available",
        type: "danger",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: {
          duration: 5000,
          onScreen: true,
        },
      });
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

      Store.addNotification({
        title: "Successfully Chosen the number",
        type: "success",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: {
          duration: 5000,
          onScreen: true,
        },
      });
      console.log("Number Chosen");
    } catch (e) {
      console.log(e.receipt);
      Store.addNotification({
        title: "Something went wrong while selecting the number.",
        message: "Possible reasons - 1. Game ended 2. Game not started",
        type: "danger",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: {
          duration: 5000,
          onScreen: true,
        },
      });
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
      Store.addNotification({
        title: "Something went wrong while finishing the game.",
        message:
          "Possible reasons - 1. Game already ended. 2. No game created by you.",
        type: "danger",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: {
          duration: 5000,
          onScreen: true,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
                  if ((x[i] >= "0" && x[i] <= "9") || x[i] === ".")
                    newx += x[i];
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
          <Button
            onClick={() => {
              onCloseGame();
            }}
          >
            Close Game
          </Button>
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
              <Button
                onClick={() => {
                  onChooseNumber();
                }}
              >
                Choose Number to Bid On
              </Button>
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
              mustSpin={state.mustSpin}
            />
          )}
        </GameContainer>
      </Container>
    </>
  );
}

export default RoulleteGame;
