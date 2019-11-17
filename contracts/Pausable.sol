pragma solidity 0.5.10;

import "./Ownable.sol";

contract Pausable is Ownable {

    bool private paused;
    bool private killed;

    constructor(bool _pausable) internal {
        paused = _pausable;
    }


    modifier whenNotPaused() {
        require(!paused, "Pausable: paused");
        _;
    }

    modifier whenPaused() {
        require(paused, "Pausable: not paused");
        _;
    }

    modifier whenNotKilled(){
        require(!killed, "Pausable: not killed");
        _;
    }

    function pause() public onlyOwner whenNotPaused {
        paused = true;
    }

    function resume() public onlyOwner whenPaused whenNotKilled {
        paused = false;
    }

    function isPaused() public view returns(bool) {
        return paused;
    }

    function kill() public onlyOwner {
        killed = true;
        paused = true;
    }

}