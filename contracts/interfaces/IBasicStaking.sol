// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IBasicStaking {
    function notifyRewardAmount(uint256 reward) external;

    function getReward() external;

    function getRewardAndDistribute() external;

    function lastTimeRewardApplicable() external view returns (uint256);

    function rewardPerToken() external view returns (uint256);

    function earned(address account) external view returns (uint256);

    function getRewardForDuration() external view returns (uint256);

    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function changeRewardsDistribution(address account) external;

    function changeRewardsDuration(uint256 duration) external;

    function refundTokens(address token) external;
}
