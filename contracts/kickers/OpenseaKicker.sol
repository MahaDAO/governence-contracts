// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {INFTStaker} from "../interfaces/INFTStaker.sol";
import {IRegistry} from "../interfaces/IRegistry.sol";
import {Order, ISeaport} from "../interfaces/opensea/ISeaport.sol";
import {KeeperCompatibleInterface} from "../interfaces/KeeperCompatibleInterface.sol";

/**
 * @title OpenseaKicker
 * @author enamakel@mahadao.com
 * @notice Kicks a NFT from staking if it has been listed on opensea.
 */
contract OpenseaKicker {
    ISeaport public seaport;
    IRegistry public registry;

    constructor(ISeaport _seaport, IRegistry _registry) {
        seaport = _seaport;
        registry = _registry;
    }

    function kickNFT(Order memory order) external {
        Order[] memory orders = new Order[](1);

        INFTStaker staker = INFTStaker(registry.staker());
        require(seaport.validate(orders), "invalid order");

        for (uint256 i = 0; i < order.parameters.offer.length; i++) {
            staker.banFromStake(order.parameters.offer[i].identifierOrCriteria);
        }
    }
}
