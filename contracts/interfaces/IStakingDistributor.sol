// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IStakingDistributor {
    event CollectorChanged(address indexed _before, address _after);

    function distributeRewards(
        address[] memory tokens,
        uint256[] memory usdPrices18 // usd prices in base 18
    ) external;
}
