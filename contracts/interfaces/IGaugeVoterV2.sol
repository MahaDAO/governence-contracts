// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IRegistry} from "./IRegistry.sol";

interface IGaugeVoterV2 {
    function attachTokenToGauge(address _tokenId, address account) external;

    function detachTokenFromGauge(address _tokenId, address account) external;

    function emitDeposit(
        address _tokenId,
        address account,
        uint256 amount
    ) external;

    function emitWithdraw(
        address _tokenId,
        address account,
        uint256 amount
    ) external;

    function distribute(address _gauge) external;

    function reset(address _who) external;

    function registry() external view returns (IRegistry);

    function notifyRewardAmount(uint256 amount) external;

    event GaugeCreated(
        address indexed gauge,
        address creator,
        address indexed bribe,
        address indexed pool
    );
    event Voted(address indexed voter, address tokenId, int256 weight);
    event Abstained(address tokenId, int256 weight);
    event Deposit(
        address indexed lp,
        address indexed gauge,
        address tokenId,
        uint256 amount
    );
    event Withdraw(
        address indexed lp,
        address indexed gauge,
        address tokenId,
        uint256 amount
    );
    event NotifyReward(
        address indexed sender,
        address indexed reward,
        uint256 amount
    );
    event DistributeReward(
        address indexed sender,
        address indexed gauge,
        uint256 amount
    );
    event Attach(address indexed owner, address indexed gauge, address tokenId);
    event Detach(address indexed owner, address indexed gauge, address tokenId);
    event Whitelisted(
        address indexed whitelister,
        address indexed token,
        bool value
    );
}
