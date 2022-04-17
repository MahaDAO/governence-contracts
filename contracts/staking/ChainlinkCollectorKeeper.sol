// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { KeeperCompatibleInterface } from "../interfaces/KeeperCompatibleInterface.sol";
import { IStakingCollector } from "../interfaces/IStakingCollector.sol";

contract ChainlinkCollectorKeeper is KeeperCompatibleInterface {
  IStakingCollector public collector;

  constructor(address _collector) {
    collector = IStakingCollector(_collector);
  }

  function checkUpkeep(bytes calldata _checkData)
    external
    view
    override
    returns (bool upkeepNeeded, bytes memory performData)
  {
    performData = "";
    upkeepNeeded = collector.callable();
  }

  function performUpkeep(bytes calldata performData) external override {
    collector.step();
  }
}
