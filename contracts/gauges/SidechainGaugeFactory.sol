// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {BaseGaugeV1} from "./BaseGaugeV1.sol";
import {IGaugeFactory} from "../interfaces/IGaugeFactory.sol";

contract SidechainGaugeFactory is IGaugeFactory {
    function createGauge(
        address _pool,
        address _bribe,
        address _registry
    ) external override returns (address) {
        // todo: need to implement sidechain gauges
    }
}
