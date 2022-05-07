// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IVoter} from "./IVoter.sol";

interface IEmissionController {
  function allocateEmission() external;
}
