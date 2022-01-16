// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Math.sol";
import "../utils/SafeERC20.sol";
import "../interfaces/IERC20.sol";
import "../interfaces/IPoolToken.sol";
import "../utils/SafeMath.sol";
import "../interfaces/IBasicStaking.sol";
import "../interfaces/IVotingEscrow.sol";
import "./BasicRewardsDistributionRecipient.sol";
import "../utils/ReentrancyGuard.sol";

// forked from https://github.com/SetProtocol/index-coop-contracts/blob/master/contracts/staking/StakingRewardsV2.sol
// NOTE: V2 allows setting of rewardsDuration in constructor
contract BasicStaking is
    IBasicStaking,
    BasicRewardsDistributionRecipient,
    ReentrancyGuard
{
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /* ========== STATE VARIABLES ========== */

    IPoolToken public rewardsToken;
    IERC20 public stakingToken;

    uint256 public periodFinish = 0;
    uint256 public rewardRate = 0;
    bool public initialized;
    uint256 public rewardsDuration;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    event ChangeRewardsDistribution(
        address indexed old,
        address indexed current
    );

    event ChangeRewardsDuration(
        uint256 old,
        uint256 current
    );

    function initialize(
        address _rewardsDistribution,
        address _rewardsToken,
        address _stakingToken,
        uint256 _rewardsDuration
    ) external {
        require(!initialized);
        rewardsDistribution = _rewardsDistribution;
        rewardsToken = IPoolToken(_rewardsToken);
        stakingToken = IERC20(_stakingToken);
        rewardsDuration = _rewardsDuration;
        initialized = true;
    }

    function changeRewardsDistribution(address account)
        external
        override
        onlyRewardsDistribution
    {
        address oldRewardsDistribution = rewardsDistribution;
        rewardsDistribution = account;
        emit ChangeRewardsDistribution(oldRewardsDistribution, account);
    }

    function changeRewardsDuration(uint256 duration)
        external
        override
        onlyRewardsDistribution
    {
        uint256 oldRewardsDuration = rewardsDuration;
        rewardsDuration = duration;
        emit ChangeRewardsDuration(oldRewardsDuration, duration);
    }

    function initializeDefault() external onlyRewardsDistribution {
        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp.add(rewardsDuration);

        rewardRate = rewardsToken.balanceOf(address(this)).div(rewardsDuration);

        emit DefaultInitialization();
    }

    /* ========== VIEWS ========== */

    function totalSupply() public view override returns (uint256) {
        return IVotingEscrow(address(stakingToken)).totalSupplyWithoutDecay();
    }

    function balanceOf(address account) public view override returns (uint256) {
        return IVotingEscrow(address(stakingToken)).balanceOf(account);
    }

    function lastTimeRewardApplicable() public view override returns (uint256) {
        return Math.min(block.timestamp, periodFinish);
    }

    function rewardPerToken() public view override returns (uint256) {
        if (totalSupply() == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored.add(
                lastTimeRewardApplicable()
                    .sub(lastUpdateTime)
                    .mul(rewardRate)
                    .mul(1e18)
                    .div(totalSupply())
            );
    }

    function earned(address account) public view override returns (uint256) {
        return
            balanceOf(account)
                .mul(rewardPerToken().sub(userRewardPerTokenPaid[account]))
                .div(1e18)
                .add(rewards[account]);
    }

    function getRewardForDuration() external view override returns (uint256) {
        return rewardRate.mul(rewardsDuration);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function getReward() public override nonReentrant {
        _updateReward(msg.sender);

        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            IERC20(address(rewardsToken)).safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    function getRewardAndDistribute() public override nonReentrant {
        _updateReward(msg.sender);

        uint256 reward = rewards[msg.sender];
        require(reward > 0, "BoostedStaking: rewards = 0");

        rewards[msg.sender] = 0;
        emit RewardPaid(msg.sender, reward);

        rewardsToken.withdrawTo(reward, msg.sender);
    }

    function exit() external {
        getRewardAndDistribute();
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function notifyRewardAmount(uint256 reward)
        external
        override
        onlyRewardsDistribution
    {
        _updateReward(address(0));

        if (block.timestamp >= periodFinish) {
            rewardRate = reward.div(rewardsDuration);
        } else {
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

    function refundTokens (address token) external override onlyRewardsDistribution {
        IERC20(token).transfer(rewardsDistribution, IERC20(token).balanceOf(address(this)));
    }

    /* ========== MODIFIERS ========== */

    function _updateReward(address who) internal {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (who != address(0)) {
            rewards[who] = earned(who);
            userRewardPerTokenPaid[who] = rewardPerTokenStored;
        }
    }

    function updateReward(address who) external {
        // Dev: only stakingToken(MAHAX) can call this update on change to lock state.
        require(msg.sender == address(stakingToken), "Not staking token");
        _updateReward(who);
    }


    /* ========== EVENTS ========== */
    event DefaultInitialization();
    event RewardAdded(uint256 reward);
    event RewardPaid(address indexed user, uint256 reward);
    event Recovered(
        address indexed tokenAddress,
        address indexed to,
        uint256 amount
    );
}
