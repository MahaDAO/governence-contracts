// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {BaseV2Bribes} from "./BaseV2Bribes.sol";
import {IBribeFactory} from "../interfaces/IBribeFactory.sol";

contract BaseV2BribesFactory is IBribeFactory {
    function createBribe(address _registry)
        external
        override
        returns (address)
    {
        address bribe = address(new BaseV2Bribes(_registry));
        emit BribeCreated(bribe);
        return bribe;
    }
}
