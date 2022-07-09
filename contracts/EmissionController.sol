// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";

import {Epoch} from "./utils/Epoch.sol";
import {IGaugeVoter} from "./interfaces/IGaugeVoter.sol";
import {IRegistry} from "./interfaces/IRegistry.sol";
import {IEmissionController} from "./interfaces/IEmissionController.sol";

contract EmissionController is IEmissionController, Epoch {
    IRegistry public registry;

    constructor(
        address _registry,
        uint256 _period,
        uint256 _startTime,
        uint256 _startEpoch
    ) Epoch(_period, _startTime, _startEpoch) {
        registry = IRegistry(_registry);
    }

    function allocateEmission() external override checkEpoch {
        uint256 mahaBalance = IERC20(registry.maha()).balanceOf(address(this));
        IERC20(registry.maha()).approve(registry.gaugeVoter(), mahaBalance);
        IGaugeVoter(registry.gaugeVoter()).notifyRewardAmount(mahaBalance);
    }
}
