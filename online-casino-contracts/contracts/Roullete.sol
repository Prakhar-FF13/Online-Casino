pragma solidity >=0.8.15;

contract Roullete {
    // Game state.
    enum GameState {
        NOTCREATED,
        STARTED,
        ENDED
    }

    uint256 randNonce = 0;

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
    event gameCreated(
        uint256 gameIdx,
        uint256 prize,
        uint256 numb,
        address createdBy
    );
    event playerJoined(
        address playerAddress_,
        uint256 playerCount,
        uint32 prize,
        uint32 numb,
        uint256 gameIdx
    );
    event gameEnded(uint256 gameIdx);

    // variables to access games easily.
    mapping(address => Game) ownerToGame;
    mapping(address => address) joinedGame;
    address[] private allGames;

    // this function creates a game for a player.
    function createGame(uint32 _numb, uint32 _prize) public {
        if (ownerToGame[msg.sender].state == GameState.STARTED) {
            uint256 gdx = 0;
            for (uint256 i = 0; i < allGames.length; i++) {
                if (msg.sender == allGames[i]) {
                    gdx = i;
                    break;
                }
            }

            emit gameCreated(
                gdx,
                ownerToGame[msg.sender].prize,
                ownerToGame[msg.sender].numb,
                msg.sender
            );
        } else {
            Game storage g = ownerToGame[msg.sender];
            g.createdBy = msg.sender;
            g.numb = _numb;
            g.prize = _prize;
            g.state = GameState.STARTED;
            g.gameMoney = 0;
            allGames.push(msg.sender);
            emit gameCreated(allGames.length - 1, g.prize, g.numb, msg.sender);
        }
    }

    // randomly join a game which is started.
    function joinGame() public payable {
        require(allGames.length > 0, "No games available");
        require(msg.value >= 0.00001 ether, "Bid too low");

        if (
            ownerToGame[joinedGame[msg.sender]].state == GameState.STARTED &&
            ownerToGame[joinedGame[msg.sender]].createdBy ==
            joinedGame[msg.sender]
        ) {
            uint256 gdx = 0;
            for (uint256 i = 0; i < allGames.length; i++) {
                if (joinedGame[msg.sender] == allGames[i]) {
                    gdx = i;
                    break;
                }
            }
            emit playerJoined(
                msg.sender,
                ownerToGame[joinedGame[msg.sender]].players.length,
                ownerToGame[joinedGame[msg.sender]].prize,
                ownerToGame[joinedGame[msg.sender]].numb,
                gdx
            );
            return;
        }

        uint256 gameIdx = 0;
        uint8 tries = 0;
        while (tries < 10) {
            gameIdx =
                uint256(
                    keccak256(
                        abi.encodePacked(block.timestamp, msg.sender, randNonce)
                    )
                ) %
                allGames.length;
            if (ownerToGame[allGames[gameIdx]].createdBy != msg.sender) break;
            tries += 1;

            randNonce++;
        }
        // could not find a game which could be joined return.
        require(tries != 10, "Could not find a game you could join");
        Game storage randGame = ownerToGame[allGames[gameIdx]];

        randGame.players.push(msg.sender);
        randGame.playerMoney.push(msg.value);
        randGame.gameMoney += msg.value;

        // store that this player has joined this game.
        joinedGame[msg.sender] = randGame.createdBy;

        // notify the ui about joined game.
        emit playerJoined(
            msg.sender,
            randGame.players.length,
            randGame.prize,
            randGame.numb,
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
        uint256 gameIdx = 1e9;
        for (uint16 i = 0; i < allGames.length; i++) {
            if (allGames[i] == g.createdBy) {
                gameIdx = i;
                for (uint16 j = i + 1; j < allGames.length; j++)
                    allGames[j - 1] = allGames[j];
                break;
            }
        }
        allGames.pop();
        delete ownerToGame[msg.sender];

        emit gameEnded(gameIdx);
    }
}
