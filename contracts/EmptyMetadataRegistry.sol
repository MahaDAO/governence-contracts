// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { IVotingEscrow } from "./interfaces/IVotingEscrow.sol";
import { IMetadataRegistry } from "./interfaces/IMetadataRegistry.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract EmptyMetadataRegistry is IMetadataRegistry {
  using SafeMath for uint256;

  enum Rarity {
    MOST_RARE,
    RARE,
    LESS_RARE,
    LESS_COMMON,
    COMMON,
    MOST_COMMON
  }

  struct Attributes {
    Rarity eyes;
    Rarity nose;
  }

  address public mahax;
  mapping (uint256 => Attributes) public nftAttributes;

  constructor(address _mahax) {
    mahax = _mahax;
  }

  function setMetadata(uint256 nftId) external override {
    require(msg.sender == mahax, "Unauthorized: not mahax");
  }

  function deleteMetadata(uint256 nftId) external override {
    require(msg.sender == mahax, "Unauthorized: not mahax");
  }
}
