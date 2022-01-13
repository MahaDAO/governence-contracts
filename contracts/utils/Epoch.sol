// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

import './Math.sol';
import './SafeMath.sol';
import './Ownable.sol';

contract Epoch is Ownable {
    using SafeMath for uint256;

    uint256 public period;
    uint256 public startTime;
    uint256 public lastExecutedAt;

    constructor(
        uint256 _period,
        uint256 _startTime,
        uint256 _startEpoch
    ) {
        require(_startTime >= block.timestamp, 'Epoch: invalid start time');
        period = _period;
        startTime = _startTime;
        lastExecutedAt = startTime.add(_startEpoch.mul(period));
    }

    modifier checkStartTime {
        require(block.timestamp >= startTime, 'Epoch: not started yet');
        _;
    }

    modifier checkEpoch {
        require(block.timestamp > startTime, 'Epoch: not started yet');
        require(callable(), 'Epoch: not allowed');
        _;
        lastExecutedAt = block.timestamp;
    }

    function callable() public view returns (bool) {
        return getCurrentEpoch() >= getNextEpoch();
    }

    function getLastEpoch() public view returns (uint256) {
        return lastExecutedAt.sub(startTime).div(period);
    }

    function getCurrentEpoch() public view returns (uint256) {
        return Math.max(startTime, block.timestamp).sub(startTime).div(period);
    }

    function getNextEpoch() public view returns (uint256) {
        if (startTime == lastExecutedAt) {
            return getLastEpoch();
        }
        return getLastEpoch().add(1);
    }

    function nextEpochPoint() public view returns (uint256) {
        return startTime.add(getNextEpoch().mul(period));
    }

    function setPeriod(uint256 _period) external onlyOwner {
        period = _period;
    }
}