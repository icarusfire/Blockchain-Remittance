pragma solidity 0.5.10;

contract Ownable {

    address private owner;

    event OwnerChangedEvent(address indexed from, address indexed to);

    constructor() internal {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can execute this action");
        _;
    }

    function setOwner(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "New Owner cant be empty");
        owner = _newOwner;
        emit OwnerChangedEvent(msg.sender, _newOwner);
    }

}