pragma solidity >=0.8.15;

contract Roullete {
    mapping(address => Game) ownerToGame;
    address[] private allGames;

    struct Game {
        uint32 numb;
        uint32 prize;
        uint256[] chosen;
        address[] players;
    }

    function createGame(uint32 _numb, uint32 _prize) public {
        Game memory g;
        g.numb = _numb;
        g.prize = _prize;
        ownerToGame[msg.sender] = g;
        allGames.push(msg.sender);
    }

    function joinGame() public payable returns (Game memory) {
        require(allGames.length > 0);
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
}
