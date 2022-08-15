import React, { useState, useEffect } from "react";
import "react-notifications-component/dist/theme.css";
import { RiseLoader } from "react-spinners";
import styled from "styled-components";
import web3 from "../../utils/web3";
import Card from "react-free-playing-cards/lib/TcN";
import { Store } from "react-notifications-component";
const contracts = require("../../utils/contractsDeployed.json");

const override = {
  display: "block",
  margin: "0 auto",
  borderColor: "red",
};

const war = new web3.eth.Contract(
  contracts.WarGame.abi,
  contracts.WarGame.address
);

const Container = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 1140px;
  margin: 0 auto;
`;

const ButtonContainer = styled.div`
  display: flex;
`;

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
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

const cardNumb = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "T",
  "J",
  "Q",
  "K",
  "A",
];
const cardSuit = ["c", "d", "h", "s"];

function getRandomCard() {
  const card = cardNumb[Math.floor(Math.random() * cardNumb.length)];
  const suit = cardSuit[Math.floor(Math.random() * cardSuit.length)];
  return card + suit;
}

function getCardForPlayers(numbOfPlayers) {
  console.log(numbOfPlayers);
  const cards = [];
  for (let i = 0; i < numbOfPlayers; i++) {
    cards.push(getRandomCard());
  }
  return cards;
}

function WarGame() {
  const [state, setState] = useState({});
  const [loading, setLoading] = useState(false);
  const [gameMoney, setGameMoney] = useState("0.001");
  const [bid, setBid] = useState("0.0001");
  useEffect(() => {
    web3.eth.getAccounts((err, accounts) => {
      if (err) console.log(err.message);
      else {
        setState({
          account: accounts[0],
          gameIdx: -1,
          createdBy: null,
          players: null,
          playerBids: null,
          playerCards: null,
          eventType: null,
        });
      }
    });

    war.events.GameInfo((err, data) => {
      if (err) {
        console.log(err);
      } else {
        const gameData = data.returnValues;
        setState((state) => {
          if (state.gameIdx !== -1 && state.gameIdx !== gameData.gameIdx)
            return state;
          if (gameData.eventType === "playRound") {
            Store.addNotification({
              title: "Round Over",
              message: "Compare your card with dealers card to see if you won",
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
          }
          if (gameData.eventType === "endGame") {
            return {
              ...state,
              gameIdx: -1,
              createdBy: null,
              players: null,
              playerBids: null,
              playerCards: null,
              eventType: null,
            };
          }
          return {
            ...state,
            gameIdx: gameData.gameIdx,
            players: gameData.players,
            createdBy: gameData.createdBy,
            playerBids: gameData.playerBids,
            playerCards: gameData.playerCards,
            eventType: gameData.eventType,
          };
        });
        Store.addNotification({
          title: "Game State Change",
          message: `${gameData.eventType}`,
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
      }
    });
  }, []);

  const createGame = async () => {
    setLoading(true);
    try {
      await war.methods.createGame().send({
        from: state.account,
        gas: 300000,
        value: web3.utils.toWei(gameMoney),
      });
    } catch (e) {
      console.log(e);
      Store.addNotification({
        title: "Something went wrong while trying to create the game",
        message:
          "Make sure the contract is deployed and minimum amount of 0.001 ether is provided",
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

  const joinGame = async () => {
    setLoading(true);
    try {
      await war.methods.joinGame().send({
        from: state.account,
        gas: 300000,
      });
    } catch (e) {
      console.log(e);
      Store.addNotification({
        title: "Something went wrong when trying to join a game",
        message: "Could not find a game for you",
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

  const closeGame = async () => {
    setLoading(true);
    try {
      await war.methods.endGame().send({
        from: state.account,
        gas: 300000,
      });
    } catch (e) {
      console.log(e);
      Store.addNotification({
        title: "Something went wrong while trying to close the game",
        message: "Make sure you created the game",
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

  const playRound = async () => {
    setLoading(true);
    try {
      await war.methods
        .playRound(getCardForPlayers(state.players.length + 1))
        .send({
          from: state.account,
          gas: 300000,
        });
    } catch (e) {
      console.log(e);
      Store.addNotification({
        title: "Something went wrong while playing the round",
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

  const playerBid = async () => {
    setLoading(true);
    try {
      await war.methods.playerBid().send({
        from: state.account,
        gas: 300000,
        value: web3.utils.toWei(bid),
      });
    } catch (e) {
      console.log(e);
      Store.addNotification({
        title: "Something went wrong while trying to bid",
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

  if (loading) {
    return (
      <Container>
        <RiseLoader
          loading={loading}
          cssOverride={override}
          size={15}
          margin={16}
        />
      </Container>
    );
  }

  const Cards = [];
  for (let i = 0; state.playerCards && i < state.playerCards.length; i++) {
    if (state.playerCards[i].length === 2) {
      Cards.push(
        <div
          style={{ display: "flex", flexDirection: "column" }}
          key={Math.random()}
        >
          <Card card={state.playerCards[i]} size={200} />
          <span>
            {state.players[i] === state.account
              ? "You"
              : i === state.playerCards.length - 1
              ? "Dealer"
              : `Player ${i}`}
          </span>
        </div>
      );
    }
  }

  return (
    <>
      <Container>
        <ButtonContainer>
          <span style={{ flex: 1, display: "flex" }}>
            <input
              type="number"
              value={gameMoney}
              style={{ flex: 1 }}
              onChange={(e) => {
                setGameMoney(e.target.value);
              }}
            />
            <Button
              onClick={() => {
                createGame();
              }}
            >
              Create Game
            </Button>
          </span>
          <Button
            onClick={() => {
              joinGame();
            }}
          >
            Join Game
          </Button>
          <Button
            onClick={() => {
              closeGame();
            }}
          >
            Close Game
          </Button>
        </ButtonContainer>
        <GameContainer>
          <div style={{ display: "flex", flex: 1 }}>
            {state.createdBy !== null ? (
              state.account === state.createdBy ? (
                <Button
                  onClick={() => {
                    playRound();
                  }}
                >
                  Play Round
                </Button>
              ) : (
                <div style={{ display: "flex" }}>
                  <input
                    type="number"
                    value={bid}
                    style={{ flex: 1 }}
                    onChange={(e) => {
                      setBid(e.target.value);
                    }}
                  />
                  <Button
                    onClick={() => {
                      playerBid();
                    }}
                  >
                    Bid
                  </Button>
                </div>
              )
            ) : null}
          </div>
          <div style={{ display: "flex", flex: 1, marginTop: "16px" }}>
            {Cards}
          </div>
        </GameContainer>
      </Container>
    </>
  );
}

export default WarGame;
