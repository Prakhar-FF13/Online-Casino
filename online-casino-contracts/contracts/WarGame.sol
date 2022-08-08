pragma solidity >=0.8.15;

contract WarGame {
    // Game state.
    enum GameState {
        NOTCREATED,
        STARTED,
        ENDED
    }

    // random nonce to generate the random index to join a game.
    uint256 randNonce = 0;

    // variables which define a game.
    struct Game {
        uint16 gameIdx;
        address createdBy; // game creator address.
        address[] players; // player addresses.
        uint256[] playerBids; // bids of players.
        uint256 gameMoney; // dealer money.
        string[] playerCards; // card with player currently.
        GameState state; // game state.
    }

    mapping(address => Game) ownerToGame;
    mapping(address => address) joinedGame;
    address[] allGames;

    event GameInfo(
        uint16 gameIdx,
        address createdBy,
        address[] players,
        uint256[] playerBids,
        string[] playerCards
    );

    // store game created by an individual.
    function createGame() public {
        Game storage game = ownerToGame[msg.sender];
        if (game.state == GameState.STARTED) {
            emit GameInfo(
                game.gameIdx,
                game.createdBy,
                game.players,
                game.playerBids,
                game.playerCards
            );
        } else {
            Game memory g;
            g.createdBy = msg.sender;
            g.state = GameState.STARTED;
            g.gameMoney = 0;
            ownerToGame[msg.sender] = g;
            allGames.push(g.createdBy);
            g.gameIdx = uint16(allGames.length);
            emit GameInfo(
                g.gameIdx,
                g.createdBy,
                g.players,
                g.playerBids,
                g.playerCards
            );
        }
    }

    function fetchCreatedGame()
        public
        view
        returns (
            uint16,
            address,
            address[] memory,
            uint256[] memory,
            GameState,
            string[] memory
        )
    {
        return (
            ownerToGame[msg.sender].gameIdx,
            ownerToGame[msg.sender].createdBy,
            ownerToGame[msg.sender].players,
            ownerToGame[msg.sender].playerBids,
            ownerToGame[msg.sender].state,
            ownerToGame[msg.sender].playerCards
        );
    }

    function fetchJoinedGame()
        public
        view
        returns (
            uint16,
            address,
            address[] memory,
            uint256[] memory,
            GameState,
            string[] memory
        )
    {
        return (
            ownerToGame[joinedGame[msg.sender]].gameIdx,
            ownerToGame[joinedGame[msg.sender]].createdBy,
            ownerToGame[joinedGame[msg.sender]].players,
            ownerToGame[joinedGame[msg.sender]].playerBids,
            ownerToGame[joinedGame[msg.sender]].state,
            ownerToGame[joinedGame[msg.sender]].playerCards
        );
    }

    function joinGame() public {
        require(allGames.length > 0, "No games available");
        if (
            ownerToGame[joinedGame[msg.sender]].state == GameState.STARTED &&
            ownerToGame[joinedGame[msg.sender]].createdBy ==
            joinedGame[msg.sender]
        ) {
            emit GameInfo(
                ownerToGame[joinedGame[msg.sender]].gameIdx,
                ownerToGame[joinedGame[msg.sender]].createdBy,
                ownerToGame[joinedGame[msg.sender]].players,
                ownerToGame[joinedGame[msg.sender]].playerBids,
                ownerToGame[joinedGame[msg.sender]].playerCards
            );
        } else {
            uint256 gameIdx = 0;
            uint8 tries = 0;
            while (tries < 10) {
                gameIdx =
                    uint256(
                        keccak256(
                            abi.encodePacked(
                                block.timestamp,
                                msg.sender,
                                randNonce
                            )
                        )
                    ) %
                    allGames.length;
                if (ownerToGame[allGames[gameIdx]].createdBy != msg.sender)
                    break;
                tries += 1;

                randNonce++;
            }
            // could not find a game which could be joined return.
            require(tries != 10, "Could not find a game you could join");

            Game storage randGame = ownerToGame[allGames[gameIdx]];

            randGame.players.push(msg.sender);
            randGame.playerBids.push(0);
            randGame.playerCards.push("");

            joinedGame[msg.sender] = randGame.createdBy;

            emit GameInfo(
                randGame.gameIdx,
                randGame.createdBy,
                randGame.players,
                randGame.playerBids,
                randGame.playerCards
            );
        }
    }
}
