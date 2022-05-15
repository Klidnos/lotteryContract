//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Lottery{
    address public manager;
    address payable[]  public  players;
    mapping(uint => mapping(address => bool)) playerActive;
    mapping(uint => address) winners;

    uint public lotteryIdx = 1;

    constructor ()  {
        manager = msg.sender;
    }

    modifier restricted(){
        require(msg.sender == manager);
        _;
    }

    function enter() public payable {
        require(msg.value == 0.01 ether, "Entrance fee is 0.01 eth.");
        require(playerActive[lotteryIdx][msg.sender] == false, "User already in lottery.");

        players.push(payable(msg.sender));
        playerActive[lotteryIdx][msg.sender] = true;
    }

    function random() private view returns(uint){
        return uint(keccak256(abi.encodePacked(block.difficulty,block.timestamp,players))) % players.length;
    }

    function pickWinner() public restricted{
        // require statements
        require(players.length >= 1, "No player in lottery");

        uint idx = random() % players.length; // select random winner
        players[idx].transfer(address(this).balance); // transfer balance to winner


        //set winner of the current lottery
        winners[lotteryIdx] = players[idx];

        // reset players
        players = new address payable[](0);
        lotteryIdx += 1;
    }

    function getWinner(uint id) public view returns(address){
        require(id < lotteryIdx, "Invalid lottery id");
        require(id > 0, "Lottery id should be bigger than 0");

        return winners[id];
    }

    function getPlayers() public view returns ( address payable[] memory ){
        return players;
    }
}