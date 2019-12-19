pragma solidity 0.5.10;

import "../Remittance.sol";

contract RemittanceMock is Remittance {

    bool public shouldExpire;

    constructor(bool _pausable) Remittance(_pausable) public {
        shouldExpire = true;
    }

    function isExpired(uint expiryTime) public view returns (bool) {
        return shouldExpire;
    }

}