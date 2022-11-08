// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {Context, Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import {INFTLocker} from "../interfaces/INFTLocker.sol";
import {IHistoricFeeDistributor} from "../interfaces/IHistoricFeeDistributor.sol";

contract HistoricFeeDistributor is IHistoricFeeDistributor, Ownable, Pausable, ReentrancyGuard {
    bytes32 public merkleRoot;

    IERC20 public maha;
    IERC20 public scallop;
    INFTLocker public locker;

    mapping (uint256 => bool) public hasClaimed;

    constructor(
        bytes32 _merkleRoot,
        address _maha,
        address _scallop,
        address _locker
    ) {
        merkleRoot = _merkleRoot;
        maha = IERC20(_maha);
        scallop = IERC20(_scallop);
        locker = INFTLocker(_locker);
    }

    function distribute(
        uint256 _tokenId,
        address _owner,
        uint256 _mahaReward,
        uint256 _scallopReward,
        bytes32[] memory proof
    ) external override nonReentrant whenNotPaused {
        require(
            hasPreviousDistribution(
                _tokenId,
                _owner,
                _mahaReward,
                _scallopReward,
                proof
            ),
            "Has no historic rewards"
        );
        require(
            !hasClaimed[_tokenId],
            "Historic rewards claimed"
        );
        require(_tokenId > 0, "Token id = 0");
        require(locker.ownerOf(_tokenId) == _owner, "Not tokenid owner");

        hasClaimed[_tokenId] = true;
        emit HistoricRewardPaid(_owner, _tokenId, _mahaReward, _scallopReward);

        maha.transfer(_owner, _mahaReward);
        scallop.transfer(_owner, _scallopReward);
    }

    function hasPreviousDistribution(
        uint256 _tokenId,
        address _owner,
        uint256 _mahaReward,
        uint256 _scallopReward,
        bytes32[] memory proof
    ) public view override returns (bool) {
        bytes32 leaf = keccak256(
            abi.encode(
                _tokenId,
                _owner,
                _mahaReward,
                _scallopReward
            )
        );
        return MerkleProof.verify(proof, merkleRoot, leaf);
    }

    function refund() external onlyOwner {
        maha.transfer(msg.sender, maha.balanceOf(address(this)));
        scallop.transfer(msg.sender, scallop.balanceOf(address(this)));
    }

    function togglePause() external onlyOwner {
        if (paused()) _unpause();
        else _pause();
    }
}
