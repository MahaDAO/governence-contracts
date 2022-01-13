// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

abstract contract BasicRewardsDistributionRecipient {
    address public rewardsDistribution;

    modifier onlyRewardsDistribution() {
        require(
            msg.sender == rewardsDistribution,
            "Caller is not RewardsDistribution contract"
        );
        _;
    }
}
