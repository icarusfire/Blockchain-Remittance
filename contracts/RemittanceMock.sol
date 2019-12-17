pragma solidity 0.5.10;

import "./Remittance.sol";

contract RemittanceMock is Remittance {

    constructor(bool _pausable) Remittance(_pausable) public {}

    function isExpired(uint expiryTime) public view returns (bool) {
        return true;
    }

}