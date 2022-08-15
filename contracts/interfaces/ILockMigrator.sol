// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ILockMigrator {
    function setMigrationReward(uint256 reward) external;

    function migrateLock(
        uint256 _value,
        uint256 _lockDuration,
        uint256 _tokenId,
        address _owner,
        bytes32[] memory proof
    ) external returns (uint256);

    function isLockValid(
        uint256 _value,
        uint256 _lockDuration,
        address _owner,
        uint256 _tokenId,
        bytes32[] memory proof
    ) external view returns (bool);

    event TransferMigrationReward(address indexed who, uint256 amount);
    event MigrationRewardChanged(uint256 oldReward, uint256 newReward);
}
