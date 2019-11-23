pragma solidity 0.5.10;

import "./Pausable.sol";

contract Remittance is Pausable {
    event accountCreatedEvent(address indexed sender, uint256 amount, bytes32 passwordHash, bool isActive);
    event withdrawEvent(address indexed sender, uint256 amount, bytes32 passwordHash);

    struct Account {
        uint256 amount;
        uint expiryHours;
        uint createdTime;
        bool isUsedBefore;
        bool isActive;
    }

    mapping(bytes32 => Account) public accounts;

    constructor(bool _pausable) Pausable(_pausable) public {}

    function createAccount(bytes32 passwordHash, uint expiryHours) public payable whenRunning {
        require(msg.value > 0, "amount should be higher than 0");
        require(passwordHash > 0, "passwordHash should not be empty");

        Account storage account = accounts[passwordHash];
        require(!account.isUsedBefore, "hash should not be used before, pick unique passwords");
        require(!account.isActive, "this account is already activated");

        account.amount = msg.value;
        account.isActive = true;
        account.createdTime = now;
        account.expiryHours = expiryHours;

        emit accountCreatedEvent(msg.sender, msg.value, passwordHash, account.isActive);
    }

    function withdraw(string memory pwd1, string memory pwd2) public whenRunning {
        require(bytes(pwd1).length > 0, "password should not be empty");
        require(bytes(pwd2).length > 0, "password should not be empty");

        bytes32 passwordHash = hashPasswords(pwd1, pwd2);
        Account storage account = accounts[passwordHash];
        uint256 amount = account.amount;

        require(!account.isUsedBefore, "hash should not be used before");
        require(amount > 0, "account should exist");
        require(!isExpired(account.createdTime, account.expiryHours), "account expired");
        emit withdrawEvent(msg.sender, amount, passwordHash);
        
        account.isActive = false;
        account.isUsedBefore = true;
        account.amount = 0;

        (bool success, ) = msg.sender.call.value(amount)("");
        require(success, "transfer failed.");
    }

    function hashPasswords(string memory password1, string memory password2) public pure returns (bytes32){
        return keccak256(abi.encodePacked(password1, password2));
    }

    function isExpired(uint timestampFirst, uint expiryHours) public view returns (bool) {
        uint HOUR_IN_SECONDS = 3600;
        uint toBeExpired = expiryHours * HOUR_IN_SECONDS;
        uint diff = uint(now - timestampFirst);
        return diff >= toBeExpired;
    }

}