// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";

import { Epoch } from "./utils/Epoch.sol";
import { IVoter } from "./interfaces/IVoter.sol";
import { IEmissionController } from "./interfaces/IEmissionController.sol";

contract EmissionController is IEmissionController, Epoch {
  IERC20 public maha;
  IVoter public voter;

  constructor(
    IERC20 _maha,
    IVoter _voter,
    uint256 _period,
    uint256 _startTime,
    uint256 _startEpoch
  ) Epoch(_period, _startTime, _startEpoch) {
    maha = _maha;
    voter = _voter;
  }

  function allocateEmission() external override onlyOperator {
    require(_callable(), "emission is not callable atm");

    uint256 mahaBalance = maha.balanceOf(address(this));
    maha.approve(address(voter), mahaBalance);
    voter.notifyRewardAmount(mahaBalance);
  }
}
