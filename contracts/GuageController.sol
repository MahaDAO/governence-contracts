// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import {SafeMath} from './utils/math/SafeMath.sol';
import {IVotingEscrow} from './interfaces/IVotingEscrow.sol';
import {IERC20} from './interfaces/IERC20.sol';

contract GuageController {
    using SafeMath for uint256;

    uint256 public constant WEEK = 604800;
    uint256 public constant WEIGHT_VOTE_DELAY = 10 * 86400;
    uint256 public time_total;
    
    address public ownerAddress;

    struct Point {
        uint256 bias;
        uint256 slope;
    }
    
    struct VotedSlope {
        uint256 slope;
        uint256 power;
        uint256 end;
    }

    IVotingEscrow private votingEscrow;  
    IERC20 private token;

    constructor(address _token, address _votingEscrow) {
        token = IERC20(_token);
        votingEscrow = IVotingEscrow(_votingEscrow);
        time_total = block.timestamp / WEEK * WEEK;
    }


}