// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IGaugeRegistry} from "../interfaces/IGaugeRegistry.sol";

abstract contract GaugeRegistry is IGaugeRegistry {
    // todo

    address[] gauges;
    mapping(address => bool) approvedFactories;
}
