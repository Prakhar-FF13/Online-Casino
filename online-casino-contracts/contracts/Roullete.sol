pragma solidity >=0.8.15;

contract Roullete {
    // Game state.
    enum GameState {
        NOTCREATED,
        STARTED,
        ENDED
    }

    // variables which define a game.
    struct Game {
        address createdBy; // game creator address.
        uint32 numb; // roullete wheel number.
        uint32 prize; // roullete wheel winning number.
        uint256 gameMoney; // total money the game is being played for.
        uint256[] playerMoney; // how much each player has put in this game.
        address[] players; // player addresses.
        mapping(address => uint16) playerChoice; // which player chose which number.
        GameState state; // game state.
    }

    // events to notify front end to change their ui based on game states.
    event playerJoined(
        address playerAddress_,
        uint256 playerCount,
        uint32 prize,
        uint256 gameIdx
    );
    event gameEnded();

    // variables to access games easily.
    mapping(address => Game) ownerToGame;
    address[] private allGames;

    // this function creates a game for a player.
    function createGame(uint32 _numb, uint32 _prize) public {
        // only create the game if no simultaneous game is not running.
        require(
            ownerToGame[msg.sender].state != GameState.STARTED,
            "A game is already running"
        );
        Game storage g = ownerToGame[msg.sender];
        g.createdBy = msg.sender;
        g.numb = _numb;
        g.prize = _prize;
        g.state = GameState.STARTED;
        g.gameMoney = 0;
        allGames.push(msg.sender);
    }

    // randomly join a game which is started.
    function joinGame() public payable {
        require(allGames.length > 0);
        require(msg.value >= 0.00001 ether);
        uint256 gameIdx = 0;
        uint8 tries = 0;
        while (tries < 10) {
            gameIdx =
                uint256(keccak256(abi.encode(block.timestamp, msg.sender))) %
                allGames.length;
            if (ownerToGame[allGames[gameIdx]].createdBy != msg.sender) break;
            tries += 1;
        }
        // could not find a game which could be joined return.
        require(tries != 10, "Could not find a game you could join");
        Game storage randGame = ownerToGame[allGames[gameIdx]];
        randGame.players.push(msg.sender);
        randGame.playerMoney.push(msg.value);
        randGame.gameMoney += msg.value;

        // notify the ui about joined game.
        emit playerJoined(
            msg.sender,
            randGame.players.length,
            randGame.prize,
            gameIdx
        );
    }

    // player joined a game choose a number to bet on.
    function chooseNumber(uint256 gameIdx, uint8 numb) public {
        Game storage g = ownerToGame[allGames[gameIdx]];
        require(
            g.state == GameState.STARTED,
            "Game has either ended or has not been started"
        );
        g.playerChoice[msg.sender] = numb;
    }

    // fetch details for a game.
    function fetchGame()
        public
        view
        returns (
            address,
            uint32,
            uint32,
            uint256,
            uint256[] memory,
            address[] memory,
            GameState state
        )
    {
        Game storage g = ownerToGame[msg.sender];
        return (
            g.createdBy,
            g.numb,
            g.prize,
            g.gameMoney,
            g.playerMoney,
            g.players,
            g.state
        );
    }

    // ends the game, emits an event telling to update ui and transfers the money to winner.
    function endGame() public payable {
        Game storage g = ownerToGame[msg.sender];
        // only creator can end the game.
        require(
            g.createdBy == msg.sender,
            "Game can only end if ended by creator"
        );
        // if game is already ended return.
        require(
            g.state != GameState.NOTCREATED && g.state != GameState.ENDED,
            "Game already ended"
        );

        // find the winner.
        address t = g.createdBy;
        address payable x = payable(t);
        for (uint256 i = 0; i < g.players.length; i++) {
            if (g.playerChoice[g.players[i]] == g.prize) {
                t = g.players[i];
                x = payable(t);
            }
        }
        // transfer the money to the winner.
        (bool success, ) = x.call{value: g.gameMoney, gas: 200000}("");

        // make sure the transfer is success.
        require(success, "Failed to send money to the winner");

        // change the state to ended for a game.
        g.state = GameState.ENDED;

        // remove from the allGames array so that it does not get picked again.
        for (uint16 i = 0; i < allGames.length; i++) {
            if (allGames[i] == g.createdBy) {
                for (uint16 j = i + 1; j < allGames.length; j++)
                    allGames[j - 1] = allGames[j];
                break;
            }
        }
        allGames.pop();
    }
}
