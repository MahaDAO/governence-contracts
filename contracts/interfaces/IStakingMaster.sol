// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IStakingMaster {
  function totalSupply() external view returns (uint256);

  function balanceOf(uint256 tokenId) external view returns (uint256);

  function getReward(uint256 tokenId) external;

  function addPool(address pool) external;

  function addPools(address[] memory pools) external;

  function updateRewardFor(uint256 tokenId) external;

  function updateRewardForMultiple(uint256[] memory tokenIds) external;

  function refundTokens(address token) external;

  function setVotingEscrow(address _escrow) external;
}
