// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IStakingChild {
    function notifyRewardAmount(uint256 reward) external;

    function getRewardFor(address who) external;

    function updateReward(address who) external;

    function lastTimeRewardApplicable() external view returns (uint256);

    function rewardPerToken() external view returns (uint256);

    function earned(address who) external view returns (uint256);

    function getRewardForDuration() external view returns (uint256);

    function totalSupply() external view returns (uint256);

    function balanceOf(address who) external view returns (uint256);

    function changeStakingMaster(address who) external;

    function changeStakingCollector(address who) external;

    function changeRewardsDuration(uint256 duration) external;

    function refundTokens(address token) external;
}