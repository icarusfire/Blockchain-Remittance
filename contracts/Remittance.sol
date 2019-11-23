pragma solidity 0.5.10;

import "./Pausable.sol";

contract Remittance is Pausable {

    event accountCreatedEvent(address indexed sender, uint256 amount, bytes32 passwordHash, bool isActive);
    event withdrawEvent(address indexed sender, uint256 amount, bytes32 passwordHash);

    struct Account {
        uint256 amount;
        uint256 expiryDate;
        bool isUsedBefore;
        bool isActive;
    }

    mapping(bytes32 => Account) public accounts;

    constructor(bool _pausable) Pausable(_pausable) public {}

    function createAccount(bytes32 passwordHash) public payable whenRunning {
        require(msg.value > 0, "Amount should be higher than 0");
        require(passwordHash > 0, "PasswordHash should not be empty");

        Account storage account = accounts[passwordHash];
        require(!account.isUsedBefore, "hash should not be used before, pick unique passwords");
        require(!account.isActive, "this account is already activated");

        account.amount = msg.value;
        account.isActive = true;
        emit accountCreatedEvent(msg.sender, msg.value, passwordHash, account.isActive);
    }

    function withdraw(string memory pwd1, string memory pwd2) public whenRunning {
        require(bytes(pwd1).length > 0, "Password should not be empty");
        require(bytes(pwd2).length > 0, "Password should not be empty");

        bytes32 passwordHash = hashPasswords(pwd1, pwd2);
        Account storage account = accounts[passwordHash];
        uint256 amount = account.amount;

        require(!account.isUsedBefore, "hash should not be used before");
        require(amount > 0, "account should exist");

        emit withdrawEvent(msg.sender, amount, passwordHash);
        account.isActive = false;
        account.isUsedBefore = true;
        account.amount = 0;
        (bool success, ) = msg.sender.call.value(amount)("");

        require(success, "Transfer failed.");
    }

    function hashPasswords(string memory password1, string memory password2) public pure returns (bytes32){
        return keccak256(abi.encodePacked(password1, password2));
    }


}