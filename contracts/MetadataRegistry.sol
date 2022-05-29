// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { IVotingEscrow } from "./interfaces/IVotingEscrow.sol";
import { IMetadataRegistry } from "./interfaces/IMetadataRegistry.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract MetadataRegistry is IMetadataRegistry {
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

  function _findVotingPowerShare(uint256 nftId) internal view returns (uint256) {
    IVotingEscrow _mahax = IVotingEscrow(mahax);
    return _mahax.balanceOfNFT(nftId).mul(100).div(_mahax.totalSupply());
  }

  function setMetadata(uint256 nftId) external override {
    require(msg.sender == mahax, "Unauthorized: not mahax");

    uint256 vpShare = _findVotingPowerShare(nftId);
    if (vpShare >= 90) {
      nftAttributes[nftId] = Attributes({
        eyes: Rarity.MOST_RARE,
        nose: Rarity.MOST_RARE
      });
    } else if (vpShare >= 80) {
      nftAttributes[nftId] = Attributes({
        eyes: Rarity.RARE,
        nose: Rarity.RARE
      });
    } else if (vpShare >= 70) {
      nftAttributes[nftId] = Attributes({
        eyes: Rarity.LESS_RARE,
        nose: Rarity.LESS_RARE
      });
    } else if (vpShare >= 60) {
      nftAttributes[nftId] = Attributes({
        eyes: Rarity.LESS_COMMON,
        nose: Rarity.LESS_COMMON
      });
    } else if (vpShare >= 50) {
      nftAttributes[nftId] = Attributes({
        eyes: Rarity.COMMON,
        nose: Rarity.COMMON
      });
    } else {
      nftAttributes[nftId] = Attributes({
        eyes: Rarity.MOST_COMMON,
        nose: Rarity.MOST_COMMON
      });
    }
  }

  function deleteMetadata(uint256 nftId) external override {
    require(msg.sender == mahax, "Unauthorized: not mahax");

    delete nftAttributes[nftId];
  }
}
