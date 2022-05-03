// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {BaseGaugeV1} from "./BaseGaugeV1.sol";

contract BaseV1GaugeFactory {
    address public last_gauge;

    function createGauge(
        address _pool,
        address _bribe,
        address _ve
    ) external returns (address) {
        last_gauge = address(new BaseGaugeV1(_pool, _bribe, _ve, msg.sender));
        return last_gauge;
    }

    function createGaugeSingle(
        address _pool,
        address _bribe,
        address _ve,
        address _voter
    ) external returns (address) {
        last_gauge = address(new BaseGaugeV1(_pool, _bribe, _ve, _voter));
        return last_gauge;
    }
}
