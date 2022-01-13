// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP. Does not include
 * the optional functions; to access them see {ERC20Detailed}.
 */
interface IVotingEscrow {
    function totalSupplyWithoutDecay() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function totalSupply(uint256 timestamp) external view returns (uint256);

    function balanceOfWithDecay(address account, uint256 timestamp)
        external
        view
        returns (uint256);
}
