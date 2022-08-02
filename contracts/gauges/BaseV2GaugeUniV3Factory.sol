// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IUniswapV3Factory} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";

import {IRegistry} from "../interfaces/IRegistry.sol";
import {BaseGaugeV2UniV3} from "./BaseGaugeV2UniV3.sol";
import {IGaugeFactory} from "../interfaces/IGaugeFactory.sol";
import {INonfungiblePositionManager} from "../interfaces/INonfungiblePositionManager.sol";

contract BaseV2GaugeUniV3Factory is IGaugeFactory {
    function createGauge(
        address _pool,
        address _bribe,
        address _registry
    ) external override returns (address) {
        address guage = address(new BaseGaugeV2UniV3(_pool, _registry));
        emit GaugeCreated(guage, _pool, _bribe);
        return guage;
    }
}
