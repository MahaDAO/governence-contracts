// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MerkleWhitelist {
    bytes32 public merkleRoot;
    mapping(address => bool) internal whitelistCache;

    function _setMerkleRoot(bytes32 root) internal {
        merkleRoot = root;
    }

    function isWhitelisted(address _who, bytes32[] memory proof)
        public
        view
        returns (bool)
    {
        bytes32 leaf = keccak256(abi.encode(_who));
        return MerkleProof.verify(proof, merkleRoot, leaf);
    }

    modifier checkWhitelist(address _who, bytes32[] memory proof) {
        if (whitelistCache[_who]) {
            _;
            return;
        }

        bytes32 leaf = keccak256(abi.encode(_who));
        require(isWhitelisted(_who, proof), "not in whitelist");
        whitelistCache[_who] = true;
        _;
    }
}
