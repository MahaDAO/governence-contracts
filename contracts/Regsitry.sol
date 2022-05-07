// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IRegistry} from "./interfaces/IRegistry.sol";

contract Registry is Ownable, IRegistry {
  address private _maha;
  address private _votingEscrow;
  address private _gaugeVoter;

  constructor(
    address __maha,
    address __gaugeVoter,
    address __votingEscrow,
    address _governance
  ) {
    _maha = __maha;
    _gaugeVoter = __gaugeVoter;
    _votingEscrow = __votingEscrow;

    _transferOwnership(_governance);
  }

  function maha() external view override returns (address) {
    return _maha;
  }

  function votingEscrow() external view override returns (address) {
    return _votingEscrow;
  }

  function gaugeVoter() external view override returns (address) {
    return _gaugeVoter;
  }

  // todo: add setters
}
