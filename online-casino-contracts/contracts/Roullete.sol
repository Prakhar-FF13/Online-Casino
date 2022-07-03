pragma solidity >=0.8.15;

contract Roullete {
    mapping(address => Game) ownerToGame;
    address[] private allGames;

    struct Game {
        uint256 numb;
        uint256 prize;
    }

    function createGame(uint256 _numb, uint256 _prize) public {
        ownerToGame[msg.sender] = Game(_numb, _prize);
        allGames.push(msg.sender);
    }
}
