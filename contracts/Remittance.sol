pragma solidity 0.5.10;

import "./Pausable.sol";
import "./SafeMath.sol";

contract Remittance is Pausable {
    using SafeMath for uint256;
    uint public constant expiryDuration = 1 hours;

    constructor(bool _pausable) Pausable(_pausable) public {}

    event accountCreatedEvent(address indexed sender, uint256 amount, bytes32 passwordHash);
    event withdrawEvent(address indexed sender, uint256 amount, bytes32 passwordHash);
    event fundsTransferedToOwnerEvent(address indexed owner, uint256 amount);

    mapping(bytes32 => Account) public accounts;

    struct Account {
        address sender;
        uint256 amount;
        uint expiryTime;
    }

    function createAccount(bytes32 passwordHash) public payable whenRunning {
        require(passwordHash > 0, "passwordHash should not be empty");
        require(msg.value > 0, "amount should be higher than 0");

        Account storage account = accounts[passwordHash];
        require(account.sender == address(0), "account already used, pick unique passwords");

        account.sender = msg.sender;
        account.amount = msg.value;
        account.expiryTime = now.add(expiryDuration);

        emit accountCreatedEvent(msg.sender, msg.value, passwordHash);
    }

    function withdraw(bytes32 passw) public whenRunning {
        bytes32 passwordHash = hashPasswords(msg.sender, passw);
        Account storage account = accounts[passwordHash];
        uint256 amount = account.amount;

        require(amount > 0, "account should exist");
        require(!isExpired(account.expiryTime), "account should not be expired");

        emit withdrawEvent(msg.sender, amount, passwordHash);
        account.amount = 0;
        account.expiryTime = 0;
        
        (bool success, ) = msg.sender.call.value(amount)("");
        require(success, "transfer failed.");
    }

    function cancelRemittance(bytes32 passwordHash) public whenRunning {
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

    function hashPasswords(address addr, bytes32 passw) public view returns (bytes32){
        require(addr != address(0), "address should not be empty");
        require(passw > 0, "password should not be empty");
        return keccak256(abi.encodePacked(addr, passw, address(this)));
    }

    function hashValidate(bytes32 passwordHash, address addr, bytes32 passw) public view returns (bool){
        require(passwordHash > 0, "passwordHash should not be empty");
        require(passw > 0, "password should not be empty");
        require(addr != address(0), "address should not be empty");
        require(passwordHash == hashPasswords(addr, passw), "Hashes do not match");
        return true;
    }

    function transferFunds() public whenKilled onlyOwner {
        uint256 amount = address(this).balance;
        emit fundsTransferedToOwnerEvent(msg.sender, amount);
        (bool success, ) = msg.sender.call.value(amount)("");
        require(success, "Transfer failed.");
    }

    function isExpired(uint expiryTime) public view returns (bool) {
        return now >= expiryTime;
    }
}