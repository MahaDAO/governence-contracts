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

    function totalAmountsStaked(IGaugeUniswapV3 gauge)
        external
        view
        returns (uint256 a0, uint256 a1)
    {
        for (uint256 i = 0; i < gauge.totalNFTSupply(); i++) {
            uint256 nftId = gauge.tokenByIndex(i);

            (
                IUniswapV3Pool pool,
                int24 _tickLower,
                int24 _tickUpper,
                uint128 liquidity
            ) = NFTPositionInfo.getPositionInfo(
                    factory,
                    nonfungiblePositionManager,
                    nftId
                );

            (uint160 sqrtRatioX96, int24 tick, , , , , ) = pool.slot0();

            console.log(
                "a0",
                _amount0(
                    _tickLower,
                    _tickUpper,
                    tick,
                    liquidity,
                    sqrtRatioX96
                ) / 1e18
            );

            console.log(
                "a1",
                _amount1(
                    _tickLower,
                    _tickUpper,
                    tick,
                    liquidity,
                    sqrtRatioX96
                ) / 1e18
            );

            a0 += _amount0(
                _tickLower,
                _tickUpper,
                tick,
                liquidity,
                sqrtRatioX96
            );
            a1 += _amount1(
                _tickLower,
                _tickUpper,
                tick,
                liquidity,
                sqrtRatioX96
            );
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
        if (tickCurrent < tickLower) {
            return
                SqrtPriceMathPartial.getAmount0Delta(
                    TickMath.getSqrtRatioAtTick(tickLower),
                    sqrtRatioX96,
                    liquidity,
                    false
                );
        } else if (tickCurrent < tickUpper) {
            return
                SqrtPriceMathPartial.getAmount0Delta(
                    TickMath.getSqrtRatioAtTick(tickLower),
                    TickMath.getSqrtRatioAtTick(tickUpper),
                    liquidity,
                    false
                );
        }

        return 0;
    }
}
