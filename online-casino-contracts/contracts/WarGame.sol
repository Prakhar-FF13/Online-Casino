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

    function joinGame() public {}
}
