pragma solidity 0.5.10;

import "./Pausable.sol";

contract Remittance is Pausable {

    event accountCreatedEvent(address indexed sender, uint256 amount, bytes32 passwordHash);
    event withdrawEvent(address indexed sender, uint256 amount, bytes32 passwordHash);

    struct Account {
        uint256 amount;
        uint256 expiryDate;
    }

    mapping(bytes32 => Account) public accounts;

    constructor(bool _pausable) Pausable(_pausable) public {}

    function createAccount(bytes32 passwordHash) public payable whenNotPaused {
        require(msg.value > 0, "Amount should be higher than 0");
        require(passwordHash > 0, "PasswordHash should not be empty");

        Account storage account = accounts[passwordHash];
        account.amount = msg.value;
        emit accountCreatedEvent(msg.sender, msg.value, passwordHash);
    }

    function withdraw(string memory password1, string memory password2, uint256 amount) public whenNotPaused {
        require(bytes(password1).length > 0, "Password should not be empty");
        require(bytes(password2).length > 0, "Password should not be empty");
        require(amount > 0, "Amount should be higher than 0");

        bytes32 passwordHash = keccak256(abi.encodePacked(password1, password2));
        Account storage account = accounts[passwordHash];
        require(account.amount == amount, "account should exist, amount should match");

        emit withdrawEvent(msg.sender, amount, passwordHash);
        delete accounts[passwordHash];

        (bool success, ) = msg.sender.call.value(account.amount)("");
        require(success, "Transfer failed.");
    }

}