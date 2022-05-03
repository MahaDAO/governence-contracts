// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IBribe {
    function notifyRewardAmount(address token, uint256 amount) external;

    function left(address token) external view returns (uint256);
}
