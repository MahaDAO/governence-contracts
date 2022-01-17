// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IERC20} from "../interfaces/IERC20.sol";
import {IStakingDistributor} from "../interfaces/IStakingDistributor.sol";
import {Epoch} from "../utils/Epoch.sol";
import {Math} from "../utils/Math.sol";
import {SafeMath} from "../utils/SafeMath.sol";

contract StakingCollector is Epoch {
    using SafeMath for uint256;

    IStakingDistributor public distributor;
    address public operator;

    mapping(address => uint256) public tokenRatePerEpoch;

    event OperatorChanged(address indexed _before, address _after);
    event DistributorChanged(address indexed _before, address _after);


    constructor(
        address _distributor,
        uint256 _period
    ) Epoch(_period, block.timestamp, 0) {
        distributor = IStakingDistributor(_distributor);
        operator = msg.sender;
    }

    // set the epoch rates; ie how much tokens to add to the staking contract every epoch
    function setEpochRates(address[] memory tokens, uint256[] memory epochRate) external onlyOwner {
        for (uint256 index = 0; index < tokens.length; index++) {
            tokenRatePerEpoch[tokens[index]] = epochRate[index];
        }
    }


    function step(
        address[] memory tokens,
        uint256[] memory usdPrices18 // usd prices in base 18
    ) external checkEpoch {
        require(msg.sender == operator, "not operator");

        for (uint256 index = 0; index < tokens.length; index++) {
            IERC20 token = IERC20(tokens[index]);

            // figure out how much tokens to send
            uint256 tokenBalance = token.balanceOf(address(this));
            uint256 ratePerEpoch = tokenRatePerEpoch[tokens[index]];
            uint256 balanceToSend = Math.min(tokenBalance, ratePerEpoch);

            // transfer that much to the distributor
            token.transfer(address(distributor), balanceToSend);
        }

        // trigger the distributor
        distributor.distributeRewards(tokens, usdPrices18);
    }

    function changeOperator(address who) external onlyOwner {
        emit OperatorChanged(operator, who);
        operator = who;
    }

    function changeDistributor(address who) external onlyOwner {
        emit DistributorChanged(address(distributor), who);
        distributor = IStakingDistributor(who);
    }

    function refundTokens (address token) external onlyOwner {
        IERC20(token).transfer(owner(), IERC20(token).balanceOf(address(this)));
    }
}
