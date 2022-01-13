// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IBasicStaking} from "../interfaces/IBasicStaking.sol";
import {IERC20} from "../interfaces/IERC20.sol";
import {IPoolToken} from "../interfaces/IPoolToken.sol";
import {IStakingDistributor} from "../interfaces/IStakingDistributor.sol";
import {Ownable} from "../utils/Ownable.sol";
import {SafeMath} from "../utils/SafeMath.sol";

contract StakingDistributor is Ownable, IStakingDistributor {
    using SafeMath for uint256;

    IBasicStaking public stakingContract;
    IPoolToken public poolToken;
    address public collector;

    constructor(
        address _stakingContract,
        address _poolToken
    ) {
        stakingContract = IBasicStaking(_stakingContract);
        poolToken = IPoolToken(_poolToken);
    }

    function distributeRewards(
        address[] memory tokens,
        uint256[] memory usdPrices18 // usd prices in base 18
    ) external override {
        require(msg.sender == collector, "not collector");
        uint256 usdAmountToMint = 0;

        for (uint256 index = 0; index < tokens.length; index++) {
            IERC20 token = IERC20(tokens[index]);

            // figure out how much usd worth of tokens are we dealing with
            uint256 tokenBalance = token.balanceOf(address(this));
            uint256 usdBalance = tokenBalance.mul(usdPrices18[index]).div(1e18);

            // transfer that much tokens to the staking contract
            token.transfer(address(stakingContract), tokenBalance);
            usdAmountToMint = usdAmountToMint.add(usdBalance);
        }

        // mint the usd balance worth of pool tokens to the staking contract
        poolToken.mint(address(stakingContract), usdAmountToMint);

        // inform the staking contract that the rewards are distributed
        stakingContract.notifyRewardAmount(usdAmountToMint);
    }

    function changeCollector(address who) external onlyOwner {
        emit CollectorChanged(collector, who);
        collector = who;
    }

    function changeRewardsDistribution(address who) external onlyOwner {
        stakingContract.changeRewardsDistribution(who);
    }

    function changeRewardsDuration(uint256 duration) external onlyOwner {
        stakingContract.changeRewardsDuration(duration);
    }
}
