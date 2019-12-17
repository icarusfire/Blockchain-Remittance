pragma solidity 0.5.10;

import "./Pausable.sol";
import "./SafeMath.sol";

contract Remittance is Pausable {
    using SafeMath for uint256;

    constructor(bool _pausable) Pausable(_pausable) public {}

    event accountCreatedEvent(address indexed sender, uint256 amount, bytes32 passwordHash);
    event withdrawEvent(address indexed sender, uint256 amount, bytes32 passwordHash);
    event FundsTransferedToOwnerEvent(address indexed owner, uint256 amount);

    mapping(bytes32 => Account) public accounts;

    struct Account {
        address sender;
        uint256 amount;
        uint expiryTime;
    }

    function createAccount(bytes32 passwordHash) public payable whenRunning {
        require(msg.value > 0, "amount should be higher than 0");
        require(passwordHash > 0, "passwordHash should not be empty");

        Account storage account = accounts[passwordHash];
        require(account.sender == address(0), "account already used, pick unique passwords");

        account.amount = msg.value;
        account.expiryTime = now.add(1 hours);
        account.sender = msg.sender;

        emit accountCreatedEvent(msg.sender, msg.value, passwordHash);
    }

    function withdraw(bytes32 pwd2) public whenRunning {
        require(pwd2.length > 0, "password should not be empty");

        bytes32 passwordHash = hashPasswords(msg.sender, pwd2);
        Account storage account = accounts[passwordHash];
        uint256 amount = account.amount;

        require(amount > 0, "account should exist");
        require(!isExpired(account.expiryTime), "account should not be expired");

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
        require(isExpired(account.expiryTime), "account should be expired");

        emit withdrawEvent(msg.sender, amount, passwordHash);
        account.amount = 0;

        (bool success, ) = msg.sender.call.value(amount)("");
        require(success, "transfer failed.");
    }

    function hashPasswords(address pwd1, bytes32 pwd2) public view returns (bytes32){
        return keccak256(abi.encodePacked(pwd1, pwd2, address(this)));
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

    function isExpired(uint expiryTime) public view returns (bool) {
        return now >= expiryTime;
    }

}