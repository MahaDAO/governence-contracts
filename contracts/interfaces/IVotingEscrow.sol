// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IVotingEscrow {
    function get_last_user_slope(address addr) external returns (int128);
    function locked__end(address addr) external returns (uint256);
}