// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {INFTLocker} from "../interfaces/INFTLocker.sol";
import {MerkleWhitelist} from "../utils/MerkleWhitelist.sol";

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract WhitelistGiveaway is Ownable, MerkleWhitelist, ReentrancyGuard {
    INFTLocker public locker;
    IERC20 public maha;
    address internal me;

    mapping(address => bool) public minted;
    uint256 public lockAmount = 100 * 1e18; // 100 maha lock
    uint256 public lockDuration = 86400 * 365 * 4; // 4 years
    uint256 public startTime;

    constructor(
        INFTLocker _locker,
        IERC20 _maha,
        uint256 _startTime
    ) {
        locker = _locker;
        maha = _maha;
        startTime = _startTime;

        maha.approve(address(locker), type(uint256).max);
        me = address(this);
    }

    function mint(
        bytes32[] memory _proof,
        bytes32 traitData,
        bool _stakeNFT
    ) external checkWhitelist(msg.sender, _proof) nonReentrant {
        // checks
        require(maha.balanceOf(me) >= lockAmount, "freemint is over.");
        require(block.timestamp >= startTime, "freemint is not yet open");
        require(!minted[msg.sender], "only one mint per address");

        // mint for the user from the current maha balance
        locker.createLockFor(
            lockAmount,
            block.timestamp + lockDuration,
            msg.sender,
            _stakeNFT
        );

        // TODO: set the trait metadata for the user

        minted[msg.sender] = true;
    }

    function refund() external onlyOwner {
        maha.transfer(msg.sender, maha.balanceOf(address(this)));
    }

    function setMerkleRoot(bytes32 root) external onlyOwner {
        _setMerkleRoot(root);
    }

    function setStartTime(uint256 _startTime) external onlyOwner {
        startTime = _startTime;
    }
}
