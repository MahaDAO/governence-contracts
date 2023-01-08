// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IGaugeRegistry {
    function addGauge(
        address _pool,
        address _gauge,
        address _bribe
    ) external;

    function removeGauge(
        address _pool,
        address _gauge,
        address _bribe
    ) external;

    event GaugeRegistered(
        address _gauge,
        address _pool,
        address _bribe,
        uint256 index
    );
    event GaugeRemoved(
        address _gauge,
        address _pool,
        address _bribe,
        uint256 index
    );
}
