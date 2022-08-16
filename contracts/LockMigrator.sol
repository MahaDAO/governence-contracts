// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Context, Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import {INFTLocker} from "./interfaces/INFTLocker.sol";
import {ILockMigrator} from "./interfaces/ILockMigrator.sol";

contract LockMigrator is ILockMigrator, Ownable {
    bytes32 public merkleRoot;

    IERC20 public maha;
    IERC20 public scallop;
    INFTLocker public mahaxLocker;

    uint256 internal constant WEEK = 1 weeks;

    // Old token id is migrated or not?
    // old token id => bool.
    mapping(uint256 => bool) public isTokenIdMigrated;

    constructor(
        bytes32 _merkleRoot,
        IERC20 _maha,
        IERC20 _scallop,
        INFTLocker _mahaxLocker
    ) {
        merkleRoot = _merkleRoot;
        maha = _maha;
        scallop = _scallop;
        mahaxLocker = _mahaxLocker;
    }

    function _sendMigrationReward(address who, uint256 mahaReward, uint256 scallopReward) internal {
        if (mahaReward > 0) {
            emit TransferMigrationReward(who, address(maha), mahaReward);
            maha.transfer(who, mahaReward);
        }

        if (scallopReward > 0) {
            emit TransferMigrationReward(who, address(scallop), mahaReward);
            scallop.transfer(who, scallopReward);
        }
    }

    function migrateLock(
        uint256 _value,
        uint256 _endDate,
        uint256 _tokenId,
        address _who,
        uint256 _mahaReward,
        uint256 _scallopReward,
        bytes32[] memory proof
    ) external override returns (uint256) {
        require(
            _endDate >= (block.timestamp + 2 * WEEK),
            "Migrator: end date expired or will expired soon"
        );
        require(_tokenId != 0, "Migrator: tokenId is 0");
        require(
            !isTokenIdMigrated[_tokenId],
            "Migrator: tokenId already migrated"
        );

        bool _isLockvalid = isLockValid(
            _value,
            _endDate,
            _who,
            _tokenId,
            _mahaReward,
            _scallopReward,
            proof
        );
        require(_isLockvalid, "Migrator: invalid lock");

        uint256 _lockDuration = _endDate - block.timestamp;
        uint256 newTokenId = mahaxLocker.migrateTokenFor(
            _value,
            _lockDuration,
            _who
        );
        require(newTokenId > 0, "Migrator: migration failed");

        isTokenIdMigrated[_tokenId] = true;
        _sendMigrationReward(msg.sender, _mahaReward, _scallopReward);

        return newTokenId;
    }

    function isLockValid(
        uint256 _value,
        uint256 _endDate,
        address _owner,
        uint256 _tokenId,
        uint256 _mahaReward,
        uint256 _scallopReward,
        bytes32[] memory proof
    ) public view override returns (bool) {
        bytes32 leaf = keccak256(
            abi.encode(_value, _endDate, _owner, _tokenId, _mahaReward, _scallopReward)
        );
        return MerkleProof.verify(proof, merkleRoot, leaf);
    }
}
