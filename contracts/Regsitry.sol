// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IRegistry} from "./interfaces/IRegistry.sol";

contract Registry is AccessControl, IRegistry {
    address private _maha;
    address private _votingEscrow;
    address private _gaugeVoter;
    bool public paused;

    bytes32 public constant EMERGENCY_STOP_ROLE =
        keccak256("EMERGENCY_STOP_ROLE");

    constructor(
        address __maha,
        address __gaugeVoter,
        address __votingEscrow,
        address _governance
    ) {
        _maha = __maha;
        _gaugeVoter = __gaugeVoter;
        _votingEscrow = __votingEscrow;

        _setupRole(DEFAULT_ADMIN_ROLE, _governance);
        _setupRole(EMERGENCY_STOP_ROLE, _governance);
    }

    modifier onlyGovernance() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "not governance");
        _;
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

    function toggleProtocol() external {
        require(
            hasRole(EMERGENCY_STOP_ROLE, msg.sender) ||
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "not governance or emergency"
        );
        paused = !paused;
    }

    function ensureNotPaused() external view override {
        require(!paused, "protocol is paused");
    }

    function setMAHA(address _new) external override onlyGovernance {
        emit MahaChanged(msg.sender, _maha, _new);
        _maha = _new;
    }

    function setVoter(address _new) external override onlyGovernance {
        emit VoterChanged(msg.sender, _gaugeVoter, _new);
        _gaugeVoter = _new;
    }

    function setLocker(address _new) external override onlyGovernance {
        emit LockerChanged(msg.sender, _votingEscrow, _new);
        _votingEscrow = _new;
    }
}
