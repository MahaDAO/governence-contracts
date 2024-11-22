// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {MerkleProofUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";

/**
 * @title MigratorMaha
 * @notice Handles the migration process for MAHA token holders by allowing them to claim an NFT and bonus tokens.
 * @dev Uses a Merkle tree to validate user details for migration. Inherits from OpenZeppelin's
 *      ERC721Upgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable, and Ownable2StepUpgradeable.
 */
contract MigratorMaha is
    ERC721Upgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    Ownable2StepUpgradeable
{
    using SafeERC20 for IERC20;

    /// @notice The Merkle root for verifying user migration details.
    bytes32 public merkleRoot;

    /// @notice The ERC20 token contract for MAHA.
    IERC20 public maha;

    /// @notice Tracks the current token ID for NFT minting.
    uint256 private _tokenId;

    /// @notice Mapping to track whether a user has already migrated.
    mapping(address => bool) public haveClaimed;

    /// @notice Struct to represent user migration details
    struct UserDetail {
        address user; // Address of the user
        uint256 nftId; // ID of the NFT being migrated
        uint256 mahaLocked; // Amount of MAHA tokens locked
        uint256 startTime; // Migration start time
        uint256 endTime; // Migration end time
        uint256 mahaBonus; // Bonus MAHA tokens to be transferred
    }

    /// @dev Custom error indicating the user has already migrated
    /// @param user The address of the user attempting to migrate
    error AlreadyMigrated(address user);

    /// @dev Custom error indicating an invalid Merkle proof
    /// @param proof The Merkle proof provided
    error InvalidMerkleProof(bytes32[] proof);

    /// @dev Custom error indicating a zero address is invalid
    error InvalidZeroAddress();

    /// @notice Event emitted when a user successfully migrates.
    /// @param user The address of the user who migrated.
    /// @param nftId The unique NFT ID minted to the user.
    /// @param bonus The bonus amount of MAHA tokens transferred to the user.
    event Migrated(address indexed user, uint256 indexed nftId, uint256 bonus);

    /**
     * @dev Initializes the Migrator contract.
     * @param _name The name of the ERC721 NFT.
     * @param _symbol The symbol of the ERC721 NFT.
     * @param _merkleRoot The Merkle root for verifying user migration data.
     * @param _maha The address of the MAHA token contract.
     */
    function init(
        string memory _name,
        string memory _symbol,
        bytes32 _merkleRoot,
        address _maha
    ) external initializer {
        __ERC721_init(_name, _symbol);
        __Ownable_init();
        __Pausable_init();
        merkleRoot = _merkleRoot;
        maha = IERC20(_maha);
    }

    /**
     * @notice Allows a user to migrate their data by minting an NFT and receiving bonus tokens.
     * @param _details A struct containing user details for the migration.
     * @param _proof The Merkle proof verifying the user's eligibility for migration.
     * @dev Verifies the Merkle proof and ensures the user has not already migrated.
     *      Transfers the bonus MAHA tokens and mints an NFT to the user.
     * @custom:reverts AlreadyMigrated If the user has already migrated.
     * @custom:reverts InvalidZeroAddress If the user's address is zero.
     * @custom:reverts InvalidMerkleProof If the provided Merkle proof is invalid.
     * @custom:requirements Migration is only allowed when the contract is not paused.
     */
    function migrate(
        UserDetail calldata _details,
        bytes32[] calldata _proof
    ) external nonReentrant whenNotPaused {
        if (haveClaimed[_details.user]) {
            revert AlreadyMigrated(_details.user);
        }
        if (_details.user == address(0)) {
            revert InvalidZeroAddress();
        }

        // Generate the Merkle leaf for the user's details
        bytes32 leaf = keccak256(
            abi.encodePacked(
                _details.user,
                _details.nftId,
                _details.mahaLocked,
                _details.startTime,
                _details.endTime,
                _details.mahaBonus
            )
        );

        // Verify the Merkle proof
        if (!MerkleProofUpgradeable.verify(_proof, merkleRoot, leaf)) {
            revert InvalidMerkleProof(_proof);
        }

        // Mark the user as having claimed
        haveClaimed[_details.user] = true;

        // Increment the token ID and mint the NFT
        uint256 tokenId = ++_tokenId;
        _mint(_details.user, tokenId);

        // Transfer the bonus MAHA tokens to the user
        IERC20(maha).safeTransfer(_details.user, _details.mahaBonus);

        // Emit the migration event
        emit Migrated(_details.user, _details.nftId, _details.mahaBonus);
    }

    /**
     * @notice Toggles the paused state of the contract.
     * @dev Can only be called by the owner. If the contract is paused, it will unpause, and vice versa.
     */
    function togglePause() external onlyOwner {
        if (paused()) _unpause();
        else _pause();
    }
}
