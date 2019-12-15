pragma solidity 0.5.10;

import "./Pausable.sol";
import "./SafeMath.sol";

contract Remittance is Pausable {
    using SafeMath for uint256;
    bytes32 public salt;

    constructor(bool _pausable) Pausable(_pausable) public {
        salt = keccak256(abi.encodePacked(address(this)));
        emit SaltCreated(msg.sender, salt);
    }

    event accountCreatedEvent(address indexed sender, uint256 amount, bytes32 passwordHash);
    event withdrawEvent(address indexed sender, uint256 amount, bytes32 passwordHash);
    event FundsTransferedToOwnerEvent(address indexed owner, uint256 amount);
    event SaltCreated(address indexed owner, bytes32 salt);

    mapping(bytes32 => Account) public accounts;

    struct Account {
        address sender;
        uint256 amount;
        uint expiryHours;
        uint createdTime;
    }

    function createAccount(bytes32 passwordHash, uint expiryHours) public payable whenRunning {
        require(msg.value > 0, "amount should be higher than 0");
        require(passwordHash > 0, "passwordHash should not be empty");

        Account storage account = accounts[passwordHash];
        require(account.sender == address(0), "account already used, pick unique passwords");

        account.amount = msg.value;
        account.createdTime = now;
        account.expiryHours = expiryHours;
        account.sender = msg.sender;

        emit accountCreatedEvent(msg.sender, msg.value, passwordHash);
    }

    function withdraw(bytes32 pwd2) public whenRunning {
        require(pwd2.length > 0, "password should not be empty");

        bytes32 passwordHash = hashPasswords(msg.sender, pwd2);
        Account storage account = accounts[passwordHash];
        uint256 amount = account.amount;

        require(amount > 0, "account should exist");
        bool isExpired = isExpired(account.createdTime, account.expiryHours);
        require(!isExpired, "account expired");
        emit withdrawEvent(msg.sender, amount, passwordHash);
        account.amount = 0;

        (bool success, ) = msg.sender.call.value(amount)("");
        require(success, "transfer failed.");
    }

    function cancelRemittance(bytes32 passwordHash) public whenRunning {
        require(passwordHash > 0, "password hash should not be empty");

        Account storage account = accounts[passwordHash];
        uint256 amount = account.amount;
        require(amount > 0, "account should exist");
        require(account.sender == msg.sender, "only sender can cancel the payment");

        bool isExpired = isExpired(account.createdTime, account.expiryHours);
        require(isExpired, "account should be expired");

        emit withdrawEvent(msg.sender, amount, passwordHash);
        account.amount = 0;

        (bool success, ) = msg.sender.call.value(amount)("");
        require(success, "transfer failed.");
    }

    function hashPasswords(address pwd1, bytes32 pwd2) public view returns (bytes32){
        return keccak256(abi.encodePacked(pwd1, pwd2, salt));
    }

    function hashValidate(bytes32 passwordHash, address pwd1, bytes32 pwd2) public view returns (bool){
        require(passwordHash == hashPasswords(pwd1, pwd2), "Hashes do not match");
        return true;
    }

    function transferFunds() public whenKilled onlyOwner {
        uint256 amount = address(this).balance;
        emit FundsTransferedToOwnerEvent(msg.sender, amount);
        (bool success, ) = msg.sender.call.value(amount)("");
        require(success, "Transfer failed.");
    }

    function isExpired(uint timestampFirst, uint expiryHours) public view returns (bool) {
        uint toBeExpired = expiryHours.mul(1 hours);
        uint diff = uint(now.sub(timestampFirst));
        return diff >= toBeExpired;
    }

}