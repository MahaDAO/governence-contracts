// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {GaugeUniswapV3} from "./GaugeUniswapV3.sol";
import {IGaugeFactory} from "../../interfaces/IGaugeFactory.sol";

abstract contract GaugeUniswapV3Factory is IGaugeFactory {
    // todo
    // function createGauge(
    //     address _pool,
    //     address _bribe,
    //     address _registry
    // ) external override returns (address) {
    //     address gauge = address(new GaugeUniswapV3(_pool, _registry));
    //     emit GaugeCreated(gauge, _pool, _bribe);
    //     return gauge;
    // }
}
