// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IVoter} from "./IVoter.sol";
import {IEpoch} from "./IEpoch.sol";

interface IEmissionController is IEpoch {
  function allocateEmission() external;
}
