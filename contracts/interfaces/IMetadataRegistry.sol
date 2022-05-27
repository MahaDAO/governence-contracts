// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IMetadataRegistry {
  function setMetadata(uint256 nftId) external;

  function deleteMetadata(uint256 nftId) external;
}
