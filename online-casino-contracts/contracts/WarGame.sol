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
        uint256 gameIdx;
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
        uint256 gameIdx,
        address createdBy,
        address[] players,
        uint256[] playerBids,
        string[] playerCards,
        string eventType
    );

    // store game created by an individual.
    function createGame() public payable {
        Game storage game = ownerToGame[msg.sender];
        if (game.state == GameState.STARTED) {
            emit GameInfo(
                game.gameIdx,
                game.createdBy,
                game.players,
                game.playerBids,
                game.playerCards,
                "fetchGame"
            );
        } else {
            require(
                msg.value >= 0.001 ether,
                "Dealer must provide at-least 0.001 ethers to begin the game"
            );
            Game memory g;
            g.createdBy = msg.sender;
            g.state = GameState.STARTED;
            g.gameMoney = msg.value;
            ownerToGame[msg.sender] = g;
            allGames.push(g.createdBy);
            g.gameIdx = uint256(allGames.length - 1);
            emit GameInfo(
                g.gameIdx,
                g.createdBy,
                g.players,
                g.playerBids,
                g.playerCards,
                "createGame"
            );
        }
    }

    function fetchCreatedGame()
        public
        view
        returns (
            uint256,
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
            uint256,
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
                ownerToGame[joinedGame[msg.sender]].playerCards,
                "joinPrevGame"
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
                randGame.playerCards,
                "joinGame"
            );
        }
    }

    function playerBid() public payable {
        require(msg.value >= 0.0001 ether, "Bid too low");
        require(msg.value <= 0.0003 ether, "Bid too high");
        Game storage game = ownerToGame[joinedGame[msg.sender]];
        require(
            game.state == GameState.STARTED,
            "Join a game to start bidding"
        );
        require(
            game.createdBy != msg.sender,
            "Game dealer cannot bid on his game"
        );
        for (uint16 i = 0; i < game.players.length; i++) {
            if (game.players[i] == msg.sender) {
                game.playerBids[i] = msg.value;
                game.gameMoney += msg.value;
                emit GameInfo(
                    game.gameIdx,
                    game.createdBy,
                    game.players,
                    game.playerBids,
                    game.playerCards,
                    "playerBid"
                );
                return;
            }
        }
    }

    // for comparing cards
    bytes32 A = keccak256(abi.encodePacked("A"));
    bytes32 K = keccak256(abi.encodePacked("K"));
    bytes32 Q = keccak256(abi.encodePacked("Q"));
    bytes32 J = keccak256(abi.encodePacked("J"));
    bytes32 T = keccak256(abi.encodePacked("T"));

    function getFirstChar(string memory _originString)
        public
        pure
        returns (string memory _firstChar)
    {
        bytes memory firstCharByte = new bytes(1);
        firstCharByte[0] = bytes(_originString)[0];
        return string(firstCharByte);
    }

    function st2num(string memory numString) public pure returns(uint) {
        uint  val=0;
        bytes   memory stringBytes = bytes(numString);
        for (uint  i =  0; i<stringBytes.length; i++) {
            uint exp = stringBytes.length - i;
            bytes1 ival = stringBytes[i];
            uint8 uval = uint8(ival);
            uint jval = uval - uint(0x30);
            val +=  (uint(jval) * (10**(exp-1)));
        }
        return val;
    }


    // returns true if card x > card y.
    function compareCard(string memory p, string memory q)
        private
        view
        returns (bool)
    {
        bytes32 x = keccak256(abi.encodePacked(getFirstChar(p)));
        bytes32 y = keccak256(abi.encodePacked(getFirstChar(q)));

        // x is Ace(A), y can be anything. x wins.
        if (x == A) return true;

        // x is King(K), x wins if y isn't an Ace(A)
        if (x == K) return y != A;

        // x is Queen(Q), x wins if y isn't Ace(A) or King(K).
        if (x == Q) return (y != A && y != K);

        // x is J, x wins if y isn't Ace(A) or King(K) or Queen(Q).
        if (x == J) return (y != A && y != K && y != Q);

        // x is T, x wins if y isn't Ace(A) or King(K) or Queen(Q) or J.
        if (x == T) return (y != A && y != K && y != Q && y != J);

        // y is Ace(A), x can be anything. y wins.
        if (y == A) return false;

        // y is King(K), y wins if x isn't an Ace(A)
        if (y == K) return x == A;

        // y is Queen(Q), y wins if x isn't Ace(A) or King(K).
        if (y == Q) return (x == A || x == K);

        // y is J, y wins if x isn't Ace(A) or King(K) or Queen(Q).
        if (y == J) return (x == A || x == K || x == Q);

        // x is T, x wins if y isn't Ace(A) or King(K) or Queen(Q) or J.
        if (y == T) return (x == A || x == K || x == Q || x == J);

        return st2num(getFirstChar(p)) >= st2num(getFirstChar(q));
    }

    function playRound(string[] memory cards) public payable {
        Game storage game = ownerToGame[msg.sender];
        require(
            game.state == GameState.STARTED,
            "Start a game to start the round"
        );
        require(game.createdBy == msg.sender, "Only game dealer can start the round");
        for (uint16 i = 0; i < game.players.length; i++) {
            game.playerCards[i] = cards[i];
        }
        string memory dealerCard = cards[cards.length - 1];
        address payable x;
        for (uint16 i = 0; i < game.players.length; i++) {
            if (compareCard(game.playerCards[i], dealerCard)) {
                x = payable(game.players[i]);
                x.call{value: game.playerBids[i] * 2, gas: 200000}("");
                game.gameMoney -= game.playerBids[i] * 2;
            } else {
                x = payable(msg.sender);
                x.call{value: game.playerBids[i], gas: 200000}("");
            }
            game.playerBids[i] = 0;
        }
        game.playerCards.push(dealerCard);
        emit GameInfo(
            game.gameIdx,
            game.createdBy,
            game.players,
            game.playerBids,
            game.playerCards,
            "playRound"
        );
    }

    function endGame() public payable {
        Game storage game = ownerToGame[msg.sender];
        require(
            game.state == GameState.STARTED,
            "No game exists"
        );
        require(game.createdBy == msg.sender, "Only game dealer can end the game");
        game.state = GameState.ENDED;
        for (uint16 i = 0; i < game.players.length; i++) {
            if (game.playerBids[i] > 0) {
                address payable x = payable(game.players[i]);
                x.call{value: game.playerBids[i], gas: 200000}("");
                game.gameMoney -= game.playerBids[i];
                game.playerBids[i] = 0;
            }
            delete joinedGame[game.players[i]];
        }
        address payable x = payable(msg.sender);
        x.call{value: game.gameMoney, gas: 200000}("");

        for (uint16 i = 0; i < allGames.length; i++) {
            if (allGames[i] == game.createdBy) {
                for (uint16 j = i + 1; j < allGames.length; j++)
                    allGames[j - 1] = allGames[j];
                break;
            }
        }
        allGames.pop();
        delete ownerToGame[msg.sender];

        emit GameInfo(
            game.gameIdx,
            game.createdBy,
            game.players,
            game.playerBids,
            game.playerCards,
            "endGame"
        );
    }
}
