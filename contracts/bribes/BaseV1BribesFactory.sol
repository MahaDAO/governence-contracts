// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {BaseV1Bribes} from "./BaseV1Bribes.sol";
import {IBribeFactory} from "../interfaces/IBribeFactory.sol";

contract BaseV1BribeFactory is IBribeFactory {
  function createBribe(address _registry) external override returns (address) {
    address bribe = address(new BaseV1Bribes(_registry));
    emit BribeCreated(bribe);
    return bribe;
  }
}
