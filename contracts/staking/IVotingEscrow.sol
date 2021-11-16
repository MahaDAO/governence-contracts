// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP. Does not include
 * the optional functions; to access them see {ERC20Detailed}.
 */
interface IVotingEscrow {
    function totalSupplyStart() external view returns (uint256);

    function balanceOfStart() external view returns (uint256);

    function totalSupply(uint256 timestamp) external view returns (uint256);

    function balanceOf(address account, uint256 timestamp)
        external
        view
        returns (uint256);
}
