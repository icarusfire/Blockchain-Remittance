pragma solidity 0.5.10;

import "./Pausable.sol";

contract Remittance is Pausable {

    event accountCreatedEvent(address indexed sender, uint256 amount, bytes32 passwordHash, bool isActive);
    event withdrawEvent(address indexed sender, uint256 amount, bytes32 passwordHash);
    event FundsTransferedToOwnerEvent(address indexed owner, uint256 amount);

    struct Account {
        address sender;
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
        account.sender = msg.sender;

        emit accountCreatedEvent(msg.sender, msg.value, passwordHash, account.isActive);
    }

    function withdraw(string memory pwd1, string memory pwd2) public whenRunning {
        require(bytes(pwd1).length > 0, "password should not be empty");
        require(bytes(pwd2).length > 0, "password should not be empty");

        bytes32 passwordHash = hashPasswords(pwd1, pwd2);
        Account storage account = accounts[passwordHash];
        uint256 amount = account.amount;

        require(amount > 0, "account should exist");
        bool isExpired = isExpired(account.createdTime, account.expiryHours);
        require(!isExpired || (msg.sender == account.sender && isExpired), "account expired");
        emit withdrawEvent(msg.sender, amount, passwordHash);

        account.isActive = false;
        account.isUsedBefore = true;
        account.amount = 0;

        (bool success, ) = msg.sender.call.value(amount)("");
        require(success, "transfer failed.");
    }

    function hashPasswords(string memory pwd1, string memory pwd2) public pure returns (bytes32){
        return keccak256(abi.encodePacked(pwd1, pwd2));
    }

    function hashValidate(bytes32 passwordHash, string memory pwd1, string memory pwd2) public pure returns (bool){
        require(passwordHash == hashPasswords(pwd1, pwd2), "Hashes do not match");
        return true;
    }

    function transferFunds() public whenPaused onlyOwner {
        uint256 amount = address(this).balance;
        emit FundsTransferedToOwnerEvent(msg.sender, amount);
        (bool success, ) = msg.sender.call.value(amount)("");
        require(success, "Transfer failed.");
    }

    function isExpired(uint timestampFirst, uint expiryHours) public view returns (bool) {
        uint HOUR_IN_SECONDS = 3600;
        uint toBeExpired = expiryHours * HOUR_IN_SECONDS;
        uint diff = uint(now - timestampFirst);
        return diff >= toBeExpired;
    }

}