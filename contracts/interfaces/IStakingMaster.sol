// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


interface IStakingMaster {
    function totalSupply() external view  returns (uint256);

    function balanceOf(address who) external view returns (uint256);

    function getReward() external ;

    function addPool(address pool) external;
    function addPools(address memory pools) external;

    function updateRewardFor(address who) external ;

    function refundTokens (address token) external ;
}
