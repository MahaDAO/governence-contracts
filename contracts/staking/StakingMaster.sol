// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

import {IStakingChild} from "../interfaces/IStakingChild.sol";
import {IStakingMaster} from "../interfaces/IStakingMaster.sol";
import {IVotingEscrow} from "../interfaces/IVotingEscrow.sol";

/**
 * The staking master contract is the high level contract responsible
 * for interfacing with the end user. It takes into account, account balances,
 * withdrawing rewards and updating staking balances.
 */
contract StakingMaster is AccessControl, ReentrancyGuard, IStakingMaster {
  using SafeERC20 for IERC20;

  bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");
  bytes32 public constant POOL_MAINTAINER_ROLE =
    keccak256("POOL_MAINTAINER_ROLE");

  IVotingEscrow public votingEscrow;
  address[] public pools;
  mapping(address => bool) public isPoolValid;

  event PoolAdded(address indexed pool);
  event VotingEscrowChanged(address indexed pool);

  constructor(address _owner, address _votingEscrow) {
    _setupRole(DEFAULT_ADMIN_ROLE, _owner);
    _setupRole(UPDATER_ROLE, _owner);

    _setupRole(UPDATER_ROLE, _msgSender());
    _setupRole(POOL_MAINTAINER_ROLE, _msgSender());

    votingEscrow = IVotingEscrow(_votingEscrow);
  }

  function totalSupply() external view override returns (uint256) {
    return votingEscrow.totalSupplyWithoutDecay();
  }

  function balanceOf(uint256 tokenId) external view override returns (uint256) {
    return votingEscrow.balanceOfNFTWithoutDecay(tokenId);
  }

  function getReward(uint256 tokenId) external override nonReentrant {
    address txSender = _msgSender();
    address tokenOwner = votingEscrow.ownerOf(tokenId);
    require(
      tokenOwner == txSender,
      "not token owner"
    );
    require(
      votingEscrow.isStaked(tokenId),
      "not staked"
    );

    for (uint256 index = 0; index < pools.length; index++) {
      IStakingChild pool = IStakingChild(pools[index]);
      pool.updateReward(tokenId);
      pool.getRewardFor(tokenId, tokenOwner);
    }
  }

  function stake(uint256 tokenId) external override nonReentrant {
    address txSender = _msgSender();
    address tokenOwner = votingEscrow.ownerOf(tokenId);
    require(
      tokenOwner == txSender,
      "not token owner"
    );
      require(
      !votingEscrow.isStaked(tokenId),
      "already staked"
    );

    votingEscrow.stake(tokenId);

    for (uint256 index = 0; index < pools.length; index++) {
      IStakingChild pool = IStakingChild(pools[index]);
      pool.updateReward(tokenId);
    }
  }

  function withdraw(uint256 tokenId) external override nonReentrant {
    address txSender = _msgSender();
    address tokenOwner = votingEscrow.ownerOf(tokenId);
    require(
      tokenOwner == txSender,
      "not token owner"
    );
    require(
      votingEscrow.isStaked(tokenId),
      "not staked"
    );

    votingEscrow.withdrawStake(tokenId);

    for (uint256 index = 0; index < pools.length; index++) {
      IStakingChild pool = IStakingChild(pools[index]);
      pool.updateReward(tokenId);
      pool.getRewardFor(tokenId, tokenOwner);
    }
  }

  function _addPool(address pool) internal {
    require(!isPoolValid[pool], "pool already added");
    pools.push(pool);
    isPoolValid[pool] = true;
    emit PoolAdded(pool);
  }

  function addPool(address pool)
    external
    override
    onlyRole(POOL_MAINTAINER_ROLE)
  {
    _addPool(pool);
  }

  function addPools(address[] memory _pools)
    external
    override
    onlyRole(POOL_MAINTAINER_ROLE)
  {
    for (uint256 index = 0; index < _pools.length; index++) {
      _addPool(_pools[index]);
    }
  }

  function updateRewardFor(uint256 tokenId)
    external
    override
    onlyRole(UPDATER_ROLE)
  {
    for (uint256 index = 0; index < pools.length; index++) {
      IStakingChild pool = IStakingChild(pools[index]);
      pool.updateReward(tokenId);
    }
  }

  function updateRewardForMultiple(uint256[] memory tokenIds)
    external
    override
    onlyRole(UPDATER_ROLE)
  {
    for (uint256 index1 = 0; index1 < tokenIds.length; index1++) {
      uint256 tokenId = tokenIds[index1];
      for (uint256 index = 0; index < pools.length; index++) {
        IStakingChild pool = IStakingChild(pools[index]);
        pool.updateReward(tokenId);
      }
    }
  }

  function refundTokens(address token)
    external
    override
    onlyRole(DEFAULT_ADMIN_ROLE)
  {
    IERC20(token).transfer(
      _msgSender(),
      IERC20(token).balanceOf(address(this))
    );
  }

  function setVotingEscrow(address _escrow)
    external
    override
    onlyRole(DEFAULT_ADMIN_ROLE)
  {
    votingEscrow = IVotingEscrow(_escrow);
    emit VotingEscrowChanged(_escrow);
  }
}
