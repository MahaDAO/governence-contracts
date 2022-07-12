// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IRegistry} from "./IRegistry.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";

interface INFTStaker is IVotes {
    function registry() external view returns (IRegistry);

    function stake(uint256 _tokenId) external;

    function unstake(uint256 _tokenId) external;

    event StakeNFT(
        address indexed who,
        address indexed owner,
        uint256 tokenId,
        uint256 amount
    );
    event UnstakeNFT(
        address indexed who,
        address indexed owner,
        uint256 tokenId,
        uint256 amount
    );
}
