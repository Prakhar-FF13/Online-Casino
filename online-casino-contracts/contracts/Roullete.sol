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
        uint256 gameMoney;
        uint256[] playerMoney;
        address[] players;
        mapping(address => uint16) playerChoice;
        GameState state;
    }

    event playerJoined(
        address playerAddress_,
        uint256 playerCount,
        uint32 prize
    );
    event gameEnded();

    mapping(address => Game) ownerToGame;
    address[] private allGames;

    function createGame(uint32 _numb, uint32 _prize) public {
        require(ownerToGame[msg.sender].state != GameState.STARTED);
        Game storage g = ownerToGame[msg.sender];
        g.createdBy = msg.sender;
        g.numb = _numb;
        g.prize = _prize;
        g.state = GameState.STARTED;
        g.gameMoney = 0;
        allGames.push(msg.sender);
    }

    function joinGame() public payable {
        require(allGames.length > 0);
        require(msg.value >= 0.00001 ether);
        Game storage randGame = ownerToGame[
            allGames[
                uint256(keccak256(abi.encode(block.timestamp, msg.sender))) %
                    allGames.length
            ]
        ];
        randGame.players.push(msg.sender);
        randGame.playerMoney.push(msg.value);
        randGame.gameMoney += msg.value;

        emit playerJoined(msg.sender, randGame.players.length, randGame.prize);
    }

    function chooseNumber(uint8 numb) public {}

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

    function endGame() public payable {
        Game storage g = ownerToGame[msg.sender];

        require(g.createdBy == msg.sender);
        require(g.state != GameState.NOTCREATED && g.state != GameState.ENDED);

        g.state = GameState.ENDED;

        for (uint16 i = 0; i < allGames.length; i++) {
            if (allGames[i] == g.createdBy) {
                for (uint16 j = i + 1; j < allGames.length; j++)
                    allGames[j - 1] = allGames[j];
                break;
            }
        }

        allGames.pop();
        address t = address(this);
        address payable x = payable(t);
        for (uint256 i = 0; i < g.players.length; i++) {
            if (g.playerChoice[g.players[i]] == g.prize) {
                t = g.players[i];
                x = payable(t);
            }
        }
        x.transfer(g.gameMoney);
    }
}
