// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {INFTLocker} from "../interfaces/INFTLocker.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {MerkleWhitelist} from "../utils/MerkleWhitelist.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract WhitelistGiveaway is Ownable, MerkleWhitelist {
    INFTLocker public locker;
    IERC20 public maha;
    address internal me;

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

    function mint(bytes32[] memory _proof, bool _stakeNFT)
        external
        checkWhitelist(msg.sender, _proof)
    {
        require(maha.balanceOf(me) >= lockAmount, "freemint is over.");
        require(block.timestamp >= startTime, "freemint is not yet open");

        locker.creat eLockFor(
            lockAmount,
            block.timestamp + lockDuration,
            msg.sender,
            _stakeNFT
        );
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
