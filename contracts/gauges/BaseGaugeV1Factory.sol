// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {BaseGaugeV1} from "./BaseGaugeV1.sol";

contract BaseV1GaugeFactory {
  address public lastGauge;

  function createGauge(
    address _pool,
    address _bribe,
    address _ve
  ) external returns (address) {
    lastGauge = address(new BaseGaugeV1(_pool, _bribe, _ve, msg.sender));
    return lastGauge;
  }

  function createGaugeSingle(
    address _pool,
    address _bribe,
    address _ve,
    address _voter
  ) external returns (address) {
    lastGauge = address(new BaseGaugeV1(_pool, _bribe, _ve, _voter));
    return lastGauge;
  }
}
