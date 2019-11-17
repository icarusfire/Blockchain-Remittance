pragma solidity 0.5.10;

import "./SafeMath.sol";
import "./Pausable.sol";

contract Splitter is Pausable {
    using SafeMath for uint256;
    event LogSplitEvent(address indexed sender, uint256 amountToBeSplitted, address indexed recp1, address indexed recp2);
    event LogWithdrawEvent(address indexed sender, uint256 amountDrawn);
    event BalanceSetEvent(address indexed sender, uint256 amount, address indexed recp);
    event FundsTransferedToOwnerEvent(address indexed owner, uint256 amount);

    mapping(address => uint256) public balances;

    constructor(bool _pausable) Pausable(_pausable) public {
    }

    function splitEther(address recp1, address recp2) public payable whenNotPaused {
        require(msg.value > 0, "Split amount should be higher than 0");
        require(recp1 != address(0) && recp2 != address(0), "Recipient addresses should not be empty");

        uint256 amount = msg.value.div(2);
        uint256 remaining = msg.value.mod(2);
        balances[recp1] = balances[recp1].add(amount);
        balances[recp2] = balances[recp2].add(amount);
        if(remaining != 0){
            balances[msg.sender] = balances[msg.sender].add(remaining);
        }
        emit LogSplitEvent(msg.sender, msg.value, recp1, recp2);
    }

    function withdraw(uint256 amount) public whenNotPaused {
        require (amount > 0, "Withdraw amount should be higher than 0");
        balances[msg.sender] = balances[msg.sender].sub(amount);
        emit LogWithdrawEvent(msg.sender, amount);
        (bool success, ) = msg.sender.call.value(amount)("");
        require(success, "Transfer failed.");
    }

    function transferFunds() public whenPaused onlyOwner {
        uint256 amount = address(this).balance;
        emit FundsTransferedToOwnerEvent(msg.sender, amount);
        (bool success, ) = msg.sender.call.value(amount)("");
        require(success, "Transfer failed.");
    }

}