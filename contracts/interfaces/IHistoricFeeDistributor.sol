// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IHistoricFeeDistributor {
    function distribute(
        uint256 _tokenId,
        address _owner,
        uint256 _mahaReward,
        uint256 _scallopReward,
        bytes32[] memory proof
    ) external;

    function hasPreviousDistribution(
        uint256 _tokenId,
        address _owner,
        uint256 _mahaReward,
        uint256 _scallopReward,
        bytes32[] memory proof
    ) external view returns (bool);

    event HistoricRewardPaid(address to, uint256 tokenId, uint256 mahaReward, uint256 scallopReward);
}
