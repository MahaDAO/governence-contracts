// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IUniswapV3Factory} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";

import {INonfungiblePositionManager} from "../interfaces/INonfungiblePositionManager.sol";

interface IGaugeV2UniV3Factory {
    function createGauge(
        address _pool,
        address _bribe,
        address _registry,
        address _refundee,
        IUniswapV3Factory _uniswapV3factory,
        INonfungiblePositionManager _nonfungiblePositionManager,
        uint256 _maxIncentiveStartLeadTime,
        uint256 _maxIncentiveDuration
    ) external returns (address);

    event GaugeCreated(
        address _gauge,
        address _pool,
        address _bribe,
        address _registry,
        address _refundee,
        address _uniswapV3factory,
        address _nonfungiblePositionManager,
        uint256 _maxIncentiveStartLeadTime,
        uint256 _maxIncentiveDuration
    );
}
