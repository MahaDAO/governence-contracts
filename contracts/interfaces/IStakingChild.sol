// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IStakingChild {
  function notifyRewardAmount(uint256 reward) external;

  function getRewardFor(uint256 tokenId, address owner) external;

  function updateReward(uint256 tokenId) external;

  function lastTimeRewardApplicable() external view returns (uint256);

  function rewardPerToken() external view returns (uint256);

  function earned(uint256 tokenId) external view returns (uint256);

  function getRewardForDuration() external view returns (uint256);

  function totalSupply() external view returns (uint256);

  function balanceOf(uint256 tokenId) external view returns (uint256);

  function changeStakingMaster(address who) external;

  function changeStakingCollector(address who) external;

  function changeRewardsDuration(uint256 duration) external;

  function refundTokens(address token) external;
}
