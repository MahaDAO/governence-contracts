// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {BaseV1Bribes} from "./BaseV1Bribes.sol";

contract BaseV1BribeFactory {
  address public lastGauge;

  function createBribe() external returns (address) {
    lastGauge = address(new BaseV1Bribes(msg.sender));
    return lastGauge;
  }
}
