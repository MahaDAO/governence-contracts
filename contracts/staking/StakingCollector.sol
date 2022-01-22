// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IERC20} from "../interfaces/IERC20.sol";
import {IStakingChild} from "../interfaces/IStakingChild.sol";
import {Epoch} from "../utils/Epoch.sol";
import {Math} from "../utils/Math.sol";
import {SafeMath} from "../utils/SafeMath.sol";

contract StakingCollector is Epoch {
    using SafeMath for uint256;

    address[] public tokens;
    mapping(address => uint256) public tokenRatePerEpoch;
    mapping(address => address) public tokenStakingPool;

    event TokenRegistered(address indexed token, address stakingPool, uint256 rate);
    event TokenUpdated(address indexed token, address stakingPool, uint256 rate);

    constructor(
        address _distributor,
        uint256 _period
    ) Epoch(_period, block.timestamp, 0) {
        // nothing
    }

    function registerToken(address token, uint256 epochRate, address stakingPool) external onlyOwner {
        require(tokenStakingPool[token] == address(0), "token already exists");

        tokenRatePerEpoch[token] = epochRate;
        tokenStakingPool[token] = stakingPool;
        emit TokenRegistered(token, stakingPool, epochRate);

        tokens.push(token);
    }

    function updateToken(address token, uint256 epochRate, address stakingPool) external onlyOwner {
        require(tokenStakingPool[token] != address(0), "token doesn't exists");

        tokenRatePerEpoch[token] = epochRate;
        tokenStakingPool[token] = stakingPool;
        emit TokenUpdated(token, stakingPool, epochRate);
    }

    function step() external checkEpoch {
        for (uint256 index = 0; index < tokens.length; index++) {
            IERC20 token = IERC20(tokens[index]);

            // figure out how much tokens to send
            uint256 tokenBalance = token.balanceOf(address(this));
            uint256 ratePerEpoch = tokenRatePerEpoch[tokens[index]];
            uint256 balanceToSend;

            // if a rate was not set, then we send everything in the contract
            if (ratePerEpoch == 0) balanceToSend = tokenBalance;

            // if a rate was set, then we send as much as we can
            else balanceToSend = Math.min(tokenBalance, ratePerEpoch);

            if (balanceToSend > 0) {
                // send token and notify the staking contract
                IStakingChild stakingPool = IStakingChild(tokenStakingPool[tokens[index]]);
                token.transfer(address(stakingPool), balanceToSend);
                stakingPool.notifyRewardAmount(balanceToSend);
            }
        }
    }

    function refundTokens (address token) external onlyOwner {
        IERC20(token).transfer(owner(), IERC20(token).balanceOf(address(this)));
    }
}
