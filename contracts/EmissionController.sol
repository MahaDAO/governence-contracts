// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";

import {IVoter} from "./interfaces/IVoter.sol";
import {IEmissionController} from "./interfaces/IEmissionController.sol";
import {Context, Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract EmissionController is IEmissionController, Context, Ownable {
  IERC20 public maha;
  IVoter public voter;

  constructor(
    IERC20 _maha
  ) {
    maha = _maha;
  }

  function setVoter(IVoter _voter) external override onlyOwner {
    voter = _voter;
  }

  function allocateEmission() external override {
    uint256 mahaBalance = maha.balanceOf(address(this));

    if (mahaBalance > 0) {
      maha.approve(address(voter), mahaBalance);
      voter.notifyRewardAmount(mahaBalance);
    }
  }
}
