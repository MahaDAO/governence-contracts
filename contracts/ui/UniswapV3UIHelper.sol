// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IUniswapV3Factory} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import {SqrtPriceMathPartial} from "../utils/SqrtPriceMathPartial.sol";
import {TickMath} from "../utils/TickMath.sol";

import {NFTPositionInfo} from "../utils/NFTPositionInfo.sol";
import {IGaugeUniswapV3} from "../interfaces/IGaugeUniswapV3.sol";
import {INonfungiblePositionManager} from "../interfaces/INonfungiblePositionManager.sol";

import "hardhat/console.sol";

contract UniswapV3UIHelper {
    uint256 public ratePerEpoch;
    mapping(address => address) public tokenStakingPool;

    /// @dev the uniswap v3 factory
    IUniswapV3Factory public factory;

    /// @dev the uniswap v3 nft position manager
    INonfungiblePositionManager public nonfungiblePositionManager;

    constructor(address _nonfungiblePositionManager) {
        nonfungiblePositionManager = INonfungiblePositionManager(
            _nonfungiblePositionManager
        );

        factory = IUniswapV3Factory(nonfungiblePositionManager.factory());
    }

    struct TotalAmountsStakedReturnPosition {
        uint256 a0;
        uint256 a1;
        uint128 liquidity;
        uint256 derivedLiquidity;
    }

    struct TotalAmountsStakedReturn {
        uint256 a0Total;
        uint256 a1Total;
        uint256 liquidityTotal;
        uint256 derivedLiquidityTotal;
        TotalAmountsStakedReturnPosition[] positions;
    }

    function amountsStaked(IGaugeUniswapV3 gauge)
        external
        view
        returns (TotalAmountsStakedReturn memory ret)
    {
        ret.positions = new TotalAmountsStakedReturnPosition[](
            gauge.totalNFTSupply()
        );

        for (uint256 i = 0; i < gauge.totalNFTSupply(); i++) {
            uint256 nftId = gauge.tokenByIndex(i);
            (
                IUniswapV3Pool pool,
                int24 _tickLower,
                int24 _tickUpper,
                uint128 _liquidity
            ) = NFTPositionInfo.getPositionInfo(
                    factory,
                    nonfungiblePositionManager,
                    nftId
                );

            (uint160 sqrtRatioX96, int24 tick, , , , , ) = pool.slot0();

            // capture position details
            TotalAmountsStakedReturnPosition
                memory p = TotalAmountsStakedReturnPosition({
                    a0: 0,
                    a1: 0,
                    liquidity: 0,
                    derivedLiquidity: 0
                });
            p.a0 = _amount0(
                _tickLower,
                _tickUpper,
                tick,
                _liquidity,
                sqrtRatioX96
            );
            p.a1 = _amount1(
                _tickLower,
                _tickUpper,
                tick,
                _liquidity,
                sqrtRatioX96
            );
            p.liquidity = _liquidity;
            p.derivedLiquidity = gauge.deposits(nftId).derivedLiquidity;

            // total it all up
            ret.derivedLiquidityTotal += gauge.deposits(nftId).derivedLiquidity;
            ret.liquidityTotal += _liquidity;
            ret.a0Total += p.a0;
            ret.a1Total += p.a1;

            ret.positions[i] = p;
        }
    }

    function totalAmountsStaked(IGaugeUniswapV3 gauge)
        external
        view
        returns (
            uint256 a0Total,
            uint256 a1Total,
            uint256 liquidityTotal,
            uint256 derivedLiquidityTotal
        )
    {
        for (uint256 i = 0; i < gauge.totalNFTSupply(); i++) {
            uint256 nftId = gauge.tokenByIndex(i);
            (
                IUniswapV3Pool pool,
                int24 _tickLower,
                int24 _tickUpper,
                uint128 _liquidity
            ) = NFTPositionInfo.getPositionInfo(
                    factory,
                    nonfungiblePositionManager,
                    nftId
                );

            (uint160 sqrtRatioX96, int24 tick, , , , , ) = pool.slot0();

            a0Total += _amount0(
                _tickLower,
                _tickUpper,
                tick,
                _liquidity,
                sqrtRatioX96
            );
            a1Total += _amount1(
                _tickLower,
                _tickUpper,
                tick,
                _liquidity,
                sqrtRatioX96
            );
            liquidityTotal += _liquidity;
            derivedLiquidityTotal += gauge.deposits(nftId).derivedLiquidity;
        }
    }

    function _amount0(
        int24 tickLower,
        int24 tickUpper,
        int24 tickCurrent,
        uint128 liquidity,
        uint160 sqrtRatioX96
    ) internal pure returns (uint256) {
        if (tickCurrent < tickLower) {
            return
                SqrtPriceMathPartial.getAmount0Delta(
                    TickMath.getSqrtRatioAtTick(tickLower),
                    TickMath.getSqrtRatioAtTick(tickUpper),
                    liquidity,
                    false
                );
        } else if (tickCurrent < tickUpper) {
            return
                SqrtPriceMathPartial.getAmount0Delta(
                    sqrtRatioX96,
                    TickMath.getSqrtRatioAtTick(tickUpper),
                    liquidity,
                    false
                );
        }

        return 0;
    }

    function _amount1(
        int24 tickLower,
        int24 tickUpper,
        int24 tickCurrent,
        uint128 liquidity,
        uint160 sqrtRatioX96
    ) internal pure returns (uint256) {
        if (tickCurrent < tickLower) return 0;
        if (tickCurrent < tickUpper) {
            return
                SqrtPriceMathPartial.getAmount1Delta(
                    TickMath.getSqrtRatioAtTick(tickLower),
                    sqrtRatioX96,
                    liquidity,
                    false
                );
        }
        return
            SqrtPriceMathPartial.getAmount1Delta(
                TickMath.getSqrtRatioAtTick(tickLower),
                TickMath.getSqrtRatioAtTick(tickUpper),
                liquidity,
                false
            );
    }
}
