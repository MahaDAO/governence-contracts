// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {EIP712, Votes} from "@openzeppelin/contracts/governance/utils/Votes.sol";

import {IGaugeVoterV2} from "./interfaces/IGaugeVoterV2.sol";
import {INFTLocker} from "./interfaces/INFTLocker.sol";
import {IRegistry, INFTStaker} from "./interfaces/INFTStaker.sol";

/**
 * This contract stakes an NFT and captures it's voting power. It is an extension
 * of openzepplin's Votes contract that also allows delegration.
 *
 * All benefits such as voting, protocol fees, rewards, special access etc.. accure
 * to NFT stakers.
 *
 * When you stake your NFT, your voting power is locked in and stops decreasing over time.
 *
 * TODO: Ensure we limit the amount of delegation power a wallet can have.
 *
 * @author Steven Enamakel <enamakel@mahadao.com>
 */
contract MAHAXStaker is ReentrancyGuard, Ownable, Votes, INFTStaker {
    IRegistry public immutable override registry;

    uint256 public totalWeight; // total voting weight

    mapping(uint256 => uint256) public stakedBalancesNFT; // nft => pool => votes
    mapping(address => uint256) public stakedBalances; // nft => pool => votes

    constructor(address _registry) EIP712("MAHAXStaker", "1") {
        registry = IRegistry(_registry);
    }

    function stake(uint256 _tokenId) external override {
        registry.ensureNotPaused();

        INFTLocker locker = INFTLocker(registry.locker());
        address _who = locker.ownerOf(_tokenId);

        require(
            locker.isApprovedOrOwner(msg.sender, _tokenId),
            "not token owner"
        );
        require(stakedBalancesNFT[_tokenId] == 0, "already staked");

        // reset gauge votes
        IGaugeVoterV2(registry.gaugeVoter()).resetFor(_who);

        uint256 _weight = locker.balanceOfNFT(_tokenId);
        _transferVotingUnits(address(0), locker.ownerOf(_tokenId), _weight);

        stakedBalancesNFT[_tokenId] += _weight;
        stakedBalances[_who] += _weight;
        locker._stake(_tokenId);

        emit StakeNFT(msg.sender, _who, _tokenId, _weight);
    }

    function unstake(uint256 _tokenId) external override {
        INFTLocker locker = INFTLocker(registry.locker());
        address _who = locker.ownerOf(_tokenId);

        require(
            locker.isApprovedOrOwner(msg.sender, _tokenId),
            "not token owner"
        );
        require(stakedBalancesNFT[_tokenId] >= 0, "not staked");

        uint256 _weight = stakedBalancesNFT[_tokenId];
        _transferVotingUnits(_who, address(0), _weight);

        stakedBalancesNFT[_tokenId] -= _weight;
        stakedBalances[_who] -= _weight;
        locker._unstake(_tokenId);

        emit UnstakeNFT(msg.sender, _who, _tokenId, _weight);
    }

    function banFromStake(uint256 _tokenId) external onlyOwner {
        // todo:
    }

    function _getVotingUnits(address who)
        internal
        view
        virtual
        override
        returns (uint256)
    {
        return stakedBalances[who];
    }
}
