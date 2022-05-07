// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {BaseGaugeV1} from "./BaseGaugeV1.sol";
import {IGaugeFactory} from "../interfaces/IGaugeFactory.sol";

contract BaseV1GaugeFactory is IGaugeFactory {
  address public lastGauge;

  function createGauge(
    address _pool,
    address _bribe,
    address _registry
  ) external override returns (address) {
    lastGauge = address(new BaseGaugeV1(_pool, _bribe, _registry));
    return lastGauge;
  }
}
