// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {KeeperCompatibleInterface} from "../interfaces/KeeperCompatibleInterface.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IGaugeVoterV2} from "../interfaces/IGaugeVoterV2.sol";
import {IEmissionController} from "../interfaces/IEmissionController.sol";

/**
 * @dev This keeper contract rewards the caller with MAHA and distributes maha emissions
 * to the various gauges every week.
 */
contract EmissionControllerKeeper is Ownable, KeeperCompatibleInterface {
    IEmissionController public emissionController;
    IGaugeVoterV2 public voter;
    IERC20 public maha;
    uint256 public mahaRewardPerEpoch;

    constructor(
        IEmissionController _emissionController,
        IGaugeVoterV2 _voter,
        IERC20 _maha,
        uint256 _mahaRewardPerEpoch
    ) {
        emissionController = _emissionController;
        voter = _voter;
        maha = _maha;
        mahaRewardPerEpoch = _mahaRewardPerEpoch;
    }

    function updateMahaReward(uint256 reward) external onlyOwner {
        mahaRewardPerEpoch = reward;
    }

    function nextUpkeepTime() external view returns (uint256) {
        return emissionController.nextEpochPoint();
    }

    function checkUpkeep(bytes calldata _checkData)
        external
        view
        override
        returns (bool, bytes memory)
    {
        bool upkeepNeeded;
        if (emissionController.callable()) upkeepNeeded = true;
        else upkeepNeeded = false;
        return (upkeepNeeded, "");
    }

    function performUpkeep(bytes calldata performData) external override {
        emissionController.allocateEmission();
        voter.distribute();

        // if the keeper wants a maha reward, we provide it with one; usually
        // non-chainlink keepers would ask for a MAHA reward
        if (performData.length > 0) {
            uint256 flag = abi.decode(performData, (uint256));
            if (flag >= 1) {
                require(
                    maha.balanceOf(address(this)) >= mahaRewardPerEpoch,
                    "not enough maha for rewards"
                );
                maha.transfer(msg.sender, mahaRewardPerEpoch);
            }
        }
    }
}
