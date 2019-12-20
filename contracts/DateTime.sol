pragma solidity 0.5.10;

contract DateTime {

        uint public constant DAY_IN_SECONDS = 86400;
        uint constant YEAR_IN_SECONDS = 31536000;
        uint constant LEAP_YEAR_IN_SECONDS = 31622400;

        uint constant HOUR_IN_SECONDS = 3600;
        uint constant MINUTE_IN_SECONDS = 60;

        function isExpired(uint timestampFirst, uint expiryHours) public view returns (bool) {
                uint toBeExpired = expiryHours * HOUR_IN_SECONDS;
                uint diff = uint(now - timestampFirst);
                return diff >= toBeExpired;
        }

        function getTotalHours(uint timestamp) public pure returns (uint8) {
                return uint8(timestamp / HOUR_IN_SECONDS);
        }

        function getHour(uint timestamp) public pure returns (uint8) {
                return uint8((timestamp / 60 / 60) % 24);
        }

        function getMinute(uint timestamp) public pure returns (uint8) {
                return uint8((timestamp / 60) % 60);
        }

        function getSecond(uint timestamp) public pure returns (uint8) {
                return uint8(timestamp % 60);
        }

}