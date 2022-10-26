// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {IUniswapV3Factory} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {IGovernorTimelock} from "@openzeppelin/contracts/governance/extensions/IGovernorTimelock.sol";

import {NFTPositionInfo} from "../utils/NFTPositionInfo.sol";
import {INonfungiblePositionManager} from "../interfaces/INonfungiblePositionManager.sol";
import {IRegistry} from "../interfaces/IRegistry.sol";
import {IGaugeVoterV2} from "../interfaces/IGaugeVoterV2.sol";
import {IGauge} from "../interfaces/IGauge.sol";
import {INFTLocker} from "../interfaces/INFTLocker.sol";
import {INFTStaker} from "../interfaces/INFTStaker.sol";

contract StakingRewardsV2 is ReentrancyGuard, IGauge {
    using SafeMath for uint256;
    using SafeMath for uint128;

    /// @notice Represents the deposit of a liquidity NFT
    struct Deposit {
        address owner;
        uint128 liquidity;
        uint128 derivedLiquidity;
    }

    /* ========== STATE VARIABLES ========== */
    IERC20 public rewardsToken;
    IRegistry public immutable override registry;
    uint256 public periodFinish = 0;
    uint256 public rewardRate = 0;
    uint256 public rewardsDuration = 7 days;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    uint256 public maxBoostRequirement = 5000e18;
    mapping(uint256 => uint256) public userRewardPerTokenPaid;

    uint256 private _totalSupply;

    /// @dev all the NFT deposits
    mapping(uint256 => Deposit) public deposits;

    /// @dev is the contract in emergency mode? if so then allow for NFTs to be withdrawn without much checks.
    bool public inEmergency;

    /// @dev [nft token id => reward count] rewards
    mapping(uint256 => uint256) public rewards;

    /// @dev the uniswap v3 factory
    IUniswapV3Factory public factory;

    /// @dev the uniswap v3 nft position manager
    INonfungiblePositionManager public nonfungiblePositionManager;

    /// @dev the pool for which we are staking the rewards
    IUniswapV3Pool public immutable pool;

    /// @dev the number of NFTs staked by the given user.
    mapping(address => uint256) public balanceOf;

    /// @dev Mapping from owner to list of owned token IDs
    mapping(address => mapping(uint256 => uint256)) private _ownedTokens;

    /// @dev Mapping from token ID to index of the owner tokens list
    mapping(uint256 => uint256) private _ownedTokensIndex;

    /// @dev Array with all token ids, used for enumeration
    uint256[] private _allTokens;

    /// @dev Mapping from token id to position in the allTokens array
    mapping(uint256 => uint256) private _allTokensIndex;

    /// @dev is the user attached to this gauge
    mapping(address => bool) public attached;

    /* ========== CONSTRUCTOR ========== */

    constructor(
        address token0,
        address token1,
        uint24 fee,
        address _registry,
        INonfungiblePositionManager _nonfungiblePositionManager
    ) {
        registry = IRegistry(_registry);
        nonfungiblePositionManager = _nonfungiblePositionManager;

        factory = IUniswapV3Factory(nonfungiblePositionManager.factory());
        rewardsToken = IERC20(IRegistry(_registry).maha());

        address _pool = factory.getPool(token0, token1, fee);
        require(_pool != address(0), "pool doesn't exist");
        pool = IUniswapV3Pool(_pool);
    }

    /* ========== VIEWS ========== */

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function left(address token) external view override returns (uint256) {
        if (block.timestamp >= periodFinish) return 0;
        uint256 _remaining = periodFinish - block.timestamp;
        return _remaining * rewardRate;
    }

    function liquidity(uint256 _tokenId) external view returns (uint256) {
        return deposits[_tokenId].liquidity;
    }

    function derivedLiquidity(uint256 _tokenId)
        external
        view
        returns (uint256)
    {
        return deposits[_tokenId].derivedLiquidity;
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

    function rewardPerToken() public view returns (uint256) {
        if (_totalSupply == 0) return rewardPerTokenStored;
        return
            rewardPerTokenStored.add(
                lastTimeRewardApplicable()
                    .sub(lastUpdateTime)
                    .mul(rewardRate)
                    .mul(1e18)
                    .div(_totalSupply)
            );
    }

    function earned(uint256 _tokenId) public view returns (uint256) {
        return
            deposits[_tokenId]
                .derivedLiquidity
                .mul(rewardPerToken().sub(userRewardPerTokenPaid[_tokenId]))
                .div(1e18)
                .add(rewards[_tokenId]);
    }

    function getRewardForDuration() external view returns (uint256) {
        return rewardRate.mul(rewardsDuration);
    }

    function derivedLiquidity(uint128 _liquidity, address account)
        public
        view
        returns (uint128)
    {
        uint128 _derived = (_liquidity * 20) / 100;
        uint256 stake = INFTStaker(registry.staker()).balanceOf(account);

        uint128 _adjusted = ((_liquidity * uint128(stake) * 80) /
            uint128(maxBoostRequirement)) / 100;

        // because of this we are able to max out the boost by 5x
        return
            _derived + _adjusted < _liquidity
                ? _derived + _adjusted
                : _liquidity;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /// @notice Upon receiving a Uniswap V3 ERC721, creates the token deposit setting owner to `from`. Also stakes token
    /// in one or more incentives if properly formatted `data` has a length > 0.
    function onERC721Received(
        address,
        address _from,
        uint256 _tokenId,
        bytes calldata data
    ) external updateReward(_tokenId) returns (bytes4) {
        require(!inEmergency, "in emergency mode");
        require(
            msg.sender == address(nonfungiblePositionManager),
            "not called from nft manager"
        );

        (IUniswapV3Pool _pool, , , uint128 _liquidity) = NFTPositionInfo
            .getPositionInfo(factory, nonfungiblePositionManager, _tokenId);

        require(_pool == pool, "token pool is not the right pool");
        require(_liquidity > 0, "cannot stake 0 liquidity");

        uint128 _derivedLiquidity = derivedLiquidity(_liquidity, _from);

        deposits[_tokenId] = Deposit({
            owner: _from,
            liquidity: _liquidity,
            derivedLiquidity: _derivedLiquidity
        });

        _addTokenToAllTokensEnumeration(_tokenId);
        _addTokenToOwnerEnumeration(_from, _tokenId);
        balanceOf[_from] += 1;
        _totalSupply = _totalSupply.add(_derivedLiquidity);

        if (!attached[_from]) {
            attached[_from] = true;
            IGaugeVoterV2(registry.gaugeVoter()).attachStakerToGauge(_from);
        }

        emit Staked(msg.sender, _tokenId, _liquidity, _derivedLiquidity);
        return this.onERC721Received.selector;
    }

    function withdraw(uint256 _tokenId)
        public
        nonReentrant
        updateReward(_tokenId)
        onlyTokenOwner(_tokenId)
    {
        require(!inEmergency, "in emergency mode");
        require(deposits[_tokenId].liquidity > 0, "Cannot withdraw 0");

        _totalSupply = _totalSupply.sub(deposits[_tokenId].derivedLiquidity);
        _removeTokenFromOwnerEnumeration(msg.sender, _tokenId);
        _removeTokenFromAllTokensEnumeration(_tokenId);
        balanceOf[msg.sender] -= 1;
        delete deposits[_tokenId];

        nonfungiblePositionManager.safeTransferFrom(
            address(this),
            msg.sender,
            _tokenId
        );

        if (balanceOf[msg.sender] == 0 && attached[msg.sender]) {
            attached[msg.sender] = false;
            IGaugeVoterV2(registry.gaugeVoter()).detachStakerFromGauge(
                msg.sender
            );
        }

        emit Withdrawn(msg.sender, _tokenId);
    }

    function withdrawViaEmergency(uint256 _tokenId)
        external
        nonReentrant
        onlyTokenOwner(_tokenId)
    {
        require(inEmergency, "not in emergency mode");
        require(deposits[_tokenId].liquidity != 0, "stake does not exist");

        delete deposits[_tokenId];
        emit Withdrawn(msg.sender, _tokenId);

        nonfungiblePositionManager.safeTransferFrom(
            address(this),
            msg.sender,
            _tokenId
        );
    }

    function getReward(uint256 _tokenId)
        public
        nonReentrant
        updateReward(_tokenId)
        onlyTokenOwner(_tokenId)
    {
        uint256 reward = rewards[_tokenId];
        if (reward > 0) {
            rewards[_tokenId] = 0;
            rewardsToken.transfer(msg.sender, reward);
            emit RewardPaid(msg.sender, _tokenId, reward);
        }
    }

    function getReward(address account, address[] memory tokens)
        external
        override
        nonReentrant
    {
        for (uint256 index = 0; index < balanceOf[account]; index++) {
            uint256 tokenId = _ownedTokens[account][index];
            getReward(tokenId);
        }
    }

    function exit(uint256 _tokenId) external {
        withdraw(_tokenId);
        getReward(_tokenId);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function notifyRewardAmount(address token, uint256 reward)
        external
        override
        updateReward(0)
    {
        require(msg.sender == registry.gaugeVoter(), "not gauge voter");

        if (block.timestamp >= periodFinish)
            rewardRate = reward.div(rewardsDuration);
        else {
            uint256 remaining = periodFinish.sub(block.timestamp);
            uint256 leftover = remaining.mul(rewardRate);
            rewardRate = reward.add(leftover).div(rewardsDuration);
        }

        // Ensure the provided reward amount is not more than the balance in the contract.
        // This keeps the reward rate in the right range, preventing overflows due to
        // very high values of rewardRate in the earned and rewardsPerToken functions;
        // Reward + leftover must be less than 2^256 / 10^18 to avoid overflow.
        uint256 balance = rewardsToken.balanceOf(address(this));
        require(
            rewardRate <= balance.div(rewardsDuration),
            "Provided reward too high"
        );

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp.add(rewardsDuration);
        emit RewardAdded(reward);
    }

    function enableEmergencyMode() external onlyTimelock {
        require(!inEmergency, "already in emergency mode");
        inEmergency = true;
        rewardsToken.transfer(
            msg.sender,
            rewardsToken.balanceOf(address(this))
        );

        emit EmergencyModeEnabled();
    }

    /// @dev in case admin needs to execute some calls directly
    function emergencyCall(address target, bytes memory signature)
        external
        onlyTimelock
    {
        require(inEmergency, "not in emergency mode");
        (bool success, bytes memory response) = target.call(signature);
        require(success, string(response));
    }

    function setMaxBoost(uint256 _maxBoostRequirement) external onlyTimelock {
        emit MaxBoostRequirementChanged(
            maxBoostRequirement,
            _maxBoostRequirement
        );
        maxBoostRequirement = _maxBoostRequirement;
    }

    function _updateLiquidity(uint256 _tokenId) internal {
        (, , , uint128 _liquidity) = NFTPositionInfo.getPositionInfo(
            factory,
            nonfungiblePositionManager,
            _tokenId
        );

        if (_liquidity == deposits[_tokenId].liquidity) return;

        address _who = deposits[_tokenId].owner;
        uint128 _derivedLiquidity = derivedLiquidity(_liquidity, _who);

        _totalSupply = _totalSupply.add(_derivedLiquidity).sub(
            deposits[_tokenId].derivedLiquidity
        );

        deposits[_tokenId].liquidity = _liquidity;
        deposits[_tokenId].derivedLiquidity = _derivedLiquidity;
    }

    /**
     * @dev Private function to add a token to this extension's ownership-tracking data structures.
     * @param to address representing the new owner of the given token ID
     * @param tokenId uint256 ID of the token to be added to the tokens list of the given address
     */
    function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private {
        uint256 length = balanceOf[to];
        _ownedTokens[to][length] = tokenId;
        _ownedTokensIndex[tokenId] = length;
    }

    /**
     * @dev Private function to add a token to this extension's token tracking data structures.
     * @param tokenId uint256 ID of the token to be added to the tokens list
     */
    function _addTokenToAllTokensEnumeration(uint256 tokenId) private {
        _allTokensIndex[tokenId] = _allTokens.length;
        _allTokens.push(tokenId);
    }

    /**
     * @dev Private function to remove a token from this extension's ownership-tracking data structures. Note that
     * while the token is not assigned a new owner, the `_ownedTokensIndex` mapping is _not_ updated: this allows for
     * gas optimizations e.g. when performing a transfer operation (avoiding double writes).
     * This has O(1) time complexity, but alters the order of the _ownedTokens array.
     * @param from address representing the previous owner of the given token ID
     * @param tokenId uint256 ID of the token to be removed from the tokens list of the given address
     */
    function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId)
        private
    {
        // To prevent a gap in from's tokens array, we store the last token in the index of the token to delete, and
        // then delete the last slot (swap and pop).

        uint256 lastTokenIndex = balanceOf[from];
        uint256 tokenIndex = _ownedTokensIndex[tokenId];

        // When the token to delete is the last token, the swap operation is unnecessary
        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];

            _ownedTokens[from][tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
            _ownedTokensIndex[lastTokenId] = tokenIndex; // Update the moved token's index
        }

        // This also deletes the contents at the last position of the array
        delete _ownedTokensIndex[tokenId];
        delete _ownedTokens[from][lastTokenIndex];
    }

    /**
     * @dev Private function to remove a token from this extension's token tracking data structures.
     * This has O(1) time complexity, but alters the order of the _allTokens array.
     * @param tokenId uint256 ID of the token to be removed from the tokens list
     */
    function _removeTokenFromAllTokensEnumeration(uint256 tokenId) private {
        // To prevent a gap in the tokens array, we store the last token in the index of the token to delete, and
        // then delete the last slot (swap and pop).

        uint256 lastTokenIndex = _allTokens.length - 1;
        uint256 tokenIndex = _allTokensIndex[tokenId];

        // When the token to delete is the last token, the swap operation is unnecessary. However, since this occurs so
        // rarely (when the last minted token is burnt) that we still do the swap here to avoid the gas cost of adding
        // an 'if' statement (like in _removeTokenFromOwnerEnumeration)
        uint256 lastTokenId = _allTokens[lastTokenIndex];

        _allTokens[tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
        _allTokensIndex[lastTokenId] = tokenIndex; // Update the moved token's index

        // This also deletes the contents at the last position of the array
        delete _allTokensIndex[tokenId];
        _allTokens.pop();
    }

    /* ========== MODIFIERS ========== */

    modifier updateReward(uint256 _tokenId) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (_tokenId != 0) {
            _updateLiquidity(_tokenId);
            rewards[_tokenId] = earned(_tokenId);
            userRewardPerTokenPaid[_tokenId] = rewardPerTokenStored;
        }
        _;
    }

    modifier onlyTimelock() {
        require(
            msg.sender == IGovernorTimelock(registry.governor()).timelock(),
            "not timelock"
        );
        _;
    }

    modifier onlyTokenOwner(uint256 _tokenId) {
        require(deposits[_tokenId].owner == msg.sender, "only tokenid owner");
        _;
    }

    /* ========== EVENTS ========== */

    event RewardAdded(uint256 reward);
    event Staked(
        address indexed user,
        uint256 tokenId,
        uint128 liquidty,
        uint128 derivedLiquidity
    );
    event Withdrawn(address indexed user, uint256 tokenId);
    event RewardPaid(address indexed user, uint256 tokenId, uint256 reward);
    event MaxBoostRequirementChanged(uint256 _old, uint256 _new);
    event EmergencyModeEnabled();
}
