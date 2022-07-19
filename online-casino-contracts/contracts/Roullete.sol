pragma solidity >=0.8.15;

contract Roullete {
    enum GameState {
        NOTCREATED,
        STARTED,
        ENDED
    }

    struct Game {
        address createdBy;
        uint32 numb;
        uint32 prize;
        uint256[] chosen;
        address[] players;
        GameState state;
    }

    mapping(address => Game) ownerToGame;
    address[] private allGames;

    function createGame(uint32 _numb, uint32 _prize) public {
        require(ownerToGame[msg.sender].state != GameState.STARTED);
        Game memory g;
        g.createdBy = msg.sender;
        g.numb = _numb;
        g.prize = _prize;
        g.state = GameState.STARTED;
        ownerToGame[msg.sender] = g;
        allGames.push(msg.sender);
    }

    function joinGame() public payable returns (Game memory) {
        require(allGames.length > 0);
        require(msg.value >= 0.00001 ether);
        Game storage randGame = ownerToGame[
            allGames[
                uint256(keccak256(abi.encode(block.timestamp, msg.sender))) %
                    allGames.length
            ]
        ];
        randGame.players.push(msg.sender);
        randGame.chosen.push(msg.value);
        return randGame;
    }

    function fetchGame() public view returns (Game memory) {
        return ownerToGame[msg.sender];
    }

    function fetchAllGames() public view returns (address[] memory) {
        return allGames;
    }

    function endGame() public {
        Game storage g = ownerToGame[msg.sender];
        require(g.createdBy == msg.sender);
        require(g.state != GameState.NOTCREATED && g.state != GameState.ENDED);
        g.state = GameState.ENDED;
    }
}
