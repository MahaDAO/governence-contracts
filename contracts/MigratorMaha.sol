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
 * @notice Manages the migration process for MAHA token holders, allowing them to claim an NFT and receive bonus tokens.
 * @dev Utilizes a Merkle tree for user verification and supports upgradable patterns through OpenZeppelin modules.
 *      This contract ensures secure migrations, owner controls, and safe token handling.
 */
contract MigratorMaha is
    ERC721Upgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    Ownable2StepUpgradeable
{
    using SafeERC20 for IERC20;

    /// @notice Merkle root used to verify the migration eligibility of users.
    bytes32 public merkleRoot;

    /// @notice Address of the MAHA token contract used for bonus distribution.
    IERC20 public maha;

    /// @notice Tracks the current token ID used for NFT minting.
    uint256 private _tokenId;

    /// @notice Stores whether a user has already claimed their migration benefits.
    mapping(address => bool) public haveClaimed;

    /// @notice Represents the details of a user's migration.
    struct UserDetail {
        address user; // Address of the user.
        uint256 nftId; // ID of the NFT to be issued.
        uint256 mahaLocked; // Amount of MAHA tokens locked by the user.
        uint256 startTime; // Migration start time.
        uint256 endTime; // Migration end time.
        uint256 mahaBonus; // Bonus MAHA tokens to be distributed to the user.
    }

    /// @dev Error indicating the user has already migrated.
    /// @param user Address of the user attempting to migrate again.
    error AlreadyMigrated(address user);

    /// @dev Error indicating that an invalid Merkle proof was provided.
    /// @param proof The invalid Merkle proof submitted.
    error InvalidMerkleProof(bytes32[] proof);

    /// @dev Error indicating a zero address was used.
    error InvalidZeroAddress();

    /// @notice Event emitted when a migration is successfully completed.
    /// @param user Address of the user who migrated.
    /// @param nftId ID of the NFT issued to the user.
    /// @param bonus Amount of bonus MAHA tokens distributed.
    event Migrated(address indexed user, uint256 indexed nftId, uint256 bonus);

    /// @notice Event emitted when the Merkle root is updated.
    /// @param oldMerkleRoot The previous Merkle root.
    /// @param newMerkleRoot The new Merkle root.
    event MerkleRootUpdated(bytes32 oldMerkleRoot, bytes32 newMerkleRoot);

    /**
     * @notice Initializes the Migrator contract.
     * @param _name Name of the ERC721 NFT.
     * @param _symbol Symbol of the ERC721 NFT.
     * @param _merkleRoot Initial Merkle root for user verification.
     * @param _maha Address of the MAHA token contract.
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
     * @notice Allows users to migrate by minting an NFT and receiving bonus MAHA tokens.
     * @param _details Struct containing user details for the migration.
     * @param _proof Merkle proof verifying the user's eligibility for migration.
     * @dev Validates Merkle proof, ensures the user has not already migrated, and performs secure token transfers.
     * @custom:reverts AlreadyMigrated If the user has already migrated.
     * @custom:reverts InvalidZeroAddress If the user's address is zero.
     * @custom:reverts InvalidMerkleProof If the Merkle proof is invalid.
     * @custom:requirements This function can only be called when the contract is not paused.
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

        if (!MerkleProofUpgradeable.verify(_proof, merkleRoot, leaf)) {
            revert InvalidMerkleProof(_proof);
        }

        haveClaimed[_details.user] = true;

        uint256 tokenId = ++_tokenId;
        _mint(_details.user, tokenId);

        IERC20(maha).safeTransfer(_details.user, _details.mahaBonus);

        emit Migrated(_details.user, _details.nftId, _details.mahaBonus);
    }

    /**
     * @notice Toggles the paused state of the contract.
     * @dev This function can only be called by the owner.
     *      If the contract is paused, it will be unpaused, and vice versa.
     */
    function togglePause() external onlyOwner {
        if (paused()) _unpause();
        else _pause();
    }

    /**
     * @notice Updates the Merkle root used for migration verification.
     * @param _newMerkleRoot The new Merkle root.
     * @dev Emits the `MerkleRootUpdated` event upon successful update.
     *      Can only be called by the owner.
     */
    function updateMerkleRoot(bytes32 _newMerkleRoot) external onlyOwner {
        bytes32 oldMerkleRoot = merkleRoot;
        merkleRoot = _newMerkleRoot;
        emit MerkleRootUpdated(oldMerkleRoot, _newMerkleRoot);
    }

    /**
     * @notice Refunds the contract's balance of a specific token to the owner.
     * @param token Address of the ERC20 token to refund.
     * @dev Transfers the entire token balance from the contract to the owner.
     *      This function is restricted to the owner.
     */
    function refund(IERC20 token) external onlyOwner {
        token.safeTransfer(msg.sender, token.balanceOf(address(this)));
    }
}
