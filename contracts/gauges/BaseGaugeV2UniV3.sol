// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";

import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import {RewardMath} from "../utils/RewardMath.sol";
import {INonfungiblePositionManager} from "../interfaces/INonfungiblePositionManager.sol";
import {IGaugeV2UniV3} from "../interfaces/IGaugeV2UniV3.sol";
import {IRegistry} from "../interfaces/IRegistry.sol";
import {NFTPositionInfo} from "../utils/NFTPositionInfo.sol";
import {Multicall} from "../utils/Multicall.sol";
import {TransferHelperExtended} from "../utils/TransferHelperExtended.sol";
import {IUniswapV3Staker} from "../interfaces/IUniswapV3Staker.sol";
import {INFTStaker} from "../interfaces/INFTStaker.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/// @title Uniswap V3 canonical staking interface
contract BaseGaugeV2UniV3 is
    IGaugeV2UniV3,
    IUniswapV3Staker,
    Multicall,
    ReentrancyGuard
{
    IRegistry public immutable override registry;
    IUniswapV3Pool public immutable pool;

    uint256 public totalRewardUnclaimed;
    uint160 public totalSecondsClaimedX128;
    uint96 public numberOfStakes;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public constant DURATION = 7 days; // rewards are released over 7 days

    /// @notice Represents the deposit of a liquidity NFT
    struct Deposit {
        address owner;
        int24 tickLower;
        int24 tickUpper;
    }

    /// @notice Represents a staked liquidity NFT
    struct Stake {
        uint160 secondsPerLiquidityInsideInitialX128;
        uint96 liquidityNoOverflow;
        uint128 liquidityIfOverflow;
        uint128 nonDerivedLiquidity;
    }

    /// @inheritdoc IUniswapV3Staker
    IUniswapV3Factory public override factory;

    /// @inheritdoc IUniswapV3Staker
    INonfungiblePositionManager public override nonfungiblePositionManager;

    /// @dev deposits[tokenId] => Deposit
    mapping(uint256 => Deposit) public override deposits;

    /// @dev stakes[tokenId] => Stake
    mapping(uint256 => Stake) private _stakes;

    uint256 public totalSupply;

    /// @dev rewards[owner] => uint256
    /// @inheritdoc IUniswapV3Staker
    mapping(address => uint256) public override rewards;

    /// @param _factory the Uniswap V3 factory
    /// @param _nonfungiblePositionManager the NFT position manager contract address
    constructor(
        address _pool,
        address _registry,
        IUniswapV3Factory _factory,
        INonfungiblePositionManager _nonfungiblePositionManager
    ) {
        pool = IUniswapV3Pool(_pool);
        registry = IRegistry(_registry);
        factory = _factory;
        nonfungiblePositionManager = _nonfungiblePositionManager;
        startTime = block.timestamp;
    }

    /// @inheritdoc IUniswapV3Staker
    function stakes(uint256 tokenId)
        public
        view
        override
        returns (
            uint160 secondsPerLiquidityInsideInitialX128,
            uint128 liquidity
        )
    {
        Stake storage stake = _stakes[tokenId];
        secondsPerLiquidityInsideInitialX128 = stake
            .secondsPerLiquidityInsideInitialX128;
        liquidity = stake.liquidityNoOverflow;
        if (liquidity == type(uint96).max)
            liquidity = stake.liquidityIfOverflow;
    }

    /// @notice Upon receiving a Uniswap V3 ERC721, creates the token deposit setting owner to `from`. Also stakes token
    /// in one or more incentives if properly formatted `data` has a length > 0.
    function onERC721Received(
        address,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        require(
            msg.sender == address(nonfungiblePositionManager),
            "UniswapV3Staker::onERC721Received: not a univ3 nft"
        );

        (
            IUniswapV3Pool _pool,
            int24 tickLower,
            int24 tickUpper,
            uint128 _liquidity
        ) = NFTPositionInfo.getPositionInfo(
                factory,
                nonfungiblePositionManager,
                tokenId
            );

        deposits[tokenId] = Deposit({
            owner: from,
            tickLower: tickLower,
            tickUpper: tickUpper
        });

        require(
            _pool == pool,
            "UniswapV3Staker::stakeToken: token pool is not the right pool"
        );
        require(
            _liquidity > 0,
            "UniswapV3Staker::stakeToken: cannot stake token with 0 liquidity"
        );

        totalSupply += uint256(_liquidity);
        uint128 liquidity = uint128(
            derivedLiquidity(_liquidity, deposits[tokenId].owner)
        );

        numberOfStakes++;

        (, uint160 secondsPerLiquidityInsideX128, ) = _pool
            .snapshotCumulativesInside(tickLower, tickUpper);

        if (liquidity >= type(uint96).max) {
            _stakes[tokenId] = Stake({
                secondsPerLiquidityInsideInitialX128: secondsPerLiquidityInsideX128,
                liquidityNoOverflow: type(uint96).max,
                liquidityIfOverflow: liquidity,
                nonDerivedLiquidity: _liquidity
            });
        } else {
            _stakes[tokenId] = Stake({
                secondsPerLiquidityInsideInitialX128: secondsPerLiquidityInsideX128,
                liquidityNoOverflow: uint96(liquidity),
                liquidityIfOverflow: 0,
                nonDerivedLiquidity: _liquidity
            });
        }

        emit TokenStaked(tokenId, _liquidity);
        return this.onERC721Received.selector;
    }

    /// @inheritdoc IUniswapV3Staker
    function withdrawToken(
        uint256 tokenId,
        address to,
        bytes memory data
    ) external override {
        // try to update rewards
        _updateReward(tokenId);

        totalSupply -= uint256(_stakes[tokenId].nonDerivedLiquidity);
        numberOfStakes--;

        require(
            to != address(this),
            "UniswapV3Staker::withdrawToken: cannot withdraw to staker"
        );
        require(
            deposits[tokenId].owner == msg.sender,
            "UniswapV3Staker::withdrawToken: only owner can withdraw token"
        );

        delete deposits[tokenId];
        delete _stakes[tokenId];

        emit TokenUnstaked(tokenId);

        nonfungiblePositionManager.safeTransferFrom(
            address(this),
            to,
            tokenId,
            data
        );
    }

    function _updateReward(uint256 tokenId) internal {
        Deposit memory deposit = deposits[tokenId];

        (
            uint160 secondsPerLiquidityInsideInitialX128,
            uint128 liquidity
        ) = stakes(tokenId);

        require(
            liquidity != 0,
            "UniswapV3Staker::unstakeToken: stake does not exist"
        );

        (, uint160 secondsPerLiquidityInsideX128, ) = pool
            .snapshotCumulativesInside(deposit.tickLower, deposit.tickUpper);

        (uint256 reward, uint160 secondsInsideX128) = RewardMath
            .computeRewardAmount(
                totalRewardUnclaimed,
                totalSecondsClaimedX128,
                startTime,
                endTime,
                liquidity,
                secondsPerLiquidityInsideInitialX128,
                secondsPerLiquidityInsideX128,
                block.timestamp
            );

        // if this overflows, e.g. after 2^32-1 full liquidity seconds have been claimed,
        // reward rate will fall drastically so it's safe
        totalSecondsClaimedX128 += secondsInsideX128;
        // reward is never greater than total reward unclaimed
        totalRewardUnclaimed -= reward;
        // this only overflows if a token has a total supply greater than type(uint256).max
        rewards[deposit.owner] += reward;
    }

    /// @inheritdoc IUniswapV3Staker
    function claimReward(uint256 tokenId, address to)
        external
        override
        returns (uint256 reward)
    {
        _updateReward(tokenId);
        reward = rewards[msg.sender];
        rewards[msg.sender] -= reward;
        TransferHelperExtended.safeTransfer(registry.maha(), to, reward);
        emit RewardClaimed(to, reward);
    }

    function derivedLiquidity(uint256 liquidity, address account)
        public
        view
        returns (uint256)
    {
        uint256 _derived = (liquidity * 20) / 100;
        uint256 _adjusted = 0;
        uint256 _supply = IERC20(registry.locker()).totalSupply();

        if (_supply > 0) {
            _adjusted = INFTStaker(registry.staker()).balanceOf(account);
            _adjusted = (((totalSupply * _adjusted) / _supply) * 80) / 100;
        }

        // because of this we are able to max out the boost by 5x
        return Math.min((_derived + _adjusted), liquidity);
    }

    function left(address token) external view override returns (uint256) {
        return totalRewardUnclaimed;
    }

    function incentives()
        external
        view
        override
        returns (
            uint256,
            uint160,
            uint96
        )
    {
        return (totalRewardUnclaimed, totalSecondsClaimedX128, numberOfStakes);
    }

    function notifyRewardAmount(address token, uint256 amount) external override nonReentrant {
        require(
            token == registry.maha(),
            "UniswapV3Staker::createIncentive: only maha allowed"
        );
        require(
            amount > 0,
            "UniswapV3Staker::createIncentive: reward must be positive"
        );

        totalRewardUnclaimed += amount;
        endTime = block.timestamp + DURATION;

        TransferHelperExtended.safeTransferFrom(
            registry.maha(),
            msg.sender,
            address(this),
            amount
        );

        emit IncentiveCreated(pool, startTime, endTime, amount);
    }
}
