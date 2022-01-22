// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IERC20} from "../interfaces/IERC20.sol";
import {SafeERC20} from "../utils/SafeERC20.sol";
import {IStakingChild} from "../interfaces/IStakingChild.sol";
import {IStakingMaster} from "../interfaces/IStakingMaster.sol";
import {IVotingEscrow} from "../interfaces/IVotingEscrow.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";
import {AccessControl} from "../utils/AccessControl.sol";

contract StakingMaster is AccessControl, ReentrancyGuard, IStakingMaster {
    using SafeERC20 for IERC20;

    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");
    bytes32 public constant POOL_MAINTAINER_ROLE = keccak256("POOL_MAINTAINER_ROLE");

    IVotingEscrow public votingEscrow;
    address[] public pools;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    event PoolAdded(address indexed pool);

    constructor(address owner) {
        _setupRole(DEFAULT_ADMIN_ROLE, owner);
        _setupRole(UPDATER_ROLE, owner);

        grantRole(UPDATER_ROLE, _msgSender());
        grantRole(POOL_MAINTAINER_ROLE, _msgSender());
    }

    function totalSupply() external view override returns (uint256) {
        return votingEscrow.totalSupplyWithoutDecay();
    }

    function balanceOf(address who) external view override returns (uint256) {
        return votingEscrow.balanceOf(who);
    }

    function getReward() external override nonReentrant {
        for (uint256 index = 0; index < pools.length; index++) {
            IStakingChild pool = IStakingChild(pools[index]);
            pool.updateReward(_msgSender());
            pool.getRewardFor(_msgSender());
        }
    }

    function addPool(address pool) external override {
        require(hasRole(POOL_MAINTAINER_ROLE, _msgSender()), "not pool maintainer");
        pools.push(pool);
        emit PoolAdded(pool);
    }

    function updateRewardFor(address who) external override {
        require(hasRole(UPDATER_ROLE, _msgSender()), "not updater");
        for (uint256 index = 0; index < pools.length; index++) {
            IStakingChild pool = IStakingChild(pools[index]);
            pool.updateReward(who);
        }
    }

    function refundTokens (address token) external override {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "not admin");
        IERC20(token).transfer(_msgSender(), IERC20(token).balanceOf(address(this)));
    }
}
