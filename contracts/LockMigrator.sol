// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Context, Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import {INFTLocker} from "./interfaces/INFTLocker.sol";

contract LockMigrator is Ownable {
    bytes32 public merkleRoot;
    uint256 public migrationReward;

    IERC20 public maha;
    INFTLocker public mahaxLocker;

    mapping (uint256 => bool) public isTokenIdMigrated;

    constructor(
        bytes32 _merkleRoot,
        IERC20 _maha,
        INFTLocker _mahaxLocker
    ) {
        merkleRoot = _merkleRoot;
        maha = _maha;
        mahaxLocker = _mahaxLocker;
    }

    function _sendMigrationReward(address who) internal {
        if (migrationReward > 0) {
            maha.transfer(who, migrationReward);
        }
    }

    function setMigrationReward(uint256 reward) external onlyOwner {
        migrationReward = reward;
    }

    function migrateLock(
        uint256 _value,
        uint256 _lockDuration,
        address _owner,
        uint256 _tokenId,
        bytes32[] memory proof
    ) external returns (uint256) {
        require(
            _tokenId != 0,
            "Migrator: invalid token id"
        );
        require(
            !isTokenIdMigrated[_tokenId],
            "Migrator: already migrated"
        );

        bool _isLockvalid = isLockValid(
            _value,
            _lockDuration,
            _owner,
            _tokenId,
            proof
        );
        require(
            _isLockvalid,
            "Migrator: invalid lock"
        );

        uint256 newTokenId = mahaxLocker.migrateTokenFor(_value, _lockDuration, _owner, true);
        require(newTokenId > 0, "Migrator: migration failed");

        isTokenIdMigrated[_tokenId] = true;
        _sendMigrationReward(_owner);

        return newTokenId;
    }

    function isLockValid(
        uint256 _value,
        uint256 _lockDuration,
        address _owner,
        uint256 _tokenId,
        bytes32[] memory proof
    ) public view returns (bool) {
        bytes32 leaf = keccak256(abi.encode(
            _value,
            _lockDuration,
            _owner,
            _tokenId
        ));

        return MerkleProof.verify(proof, merkleRoot, leaf);
    }
}
