// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IERC20} from "../interfaces/IERC20.sol";
import {IStakingChild} from "../interfaces/IStakingChild.sol";
import {IStakingCollector} from "../interfaces/IStakingCollector.sol";
import {IStakingMaster} from "../interfaces/IStakingMaster.sol";
import {Math} from "../utils/Math.sol";
import {Ownable} from "../utils/Ownable.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";
import {SafeERC20} from "../utils/SafeERC20.sol";
import {SafeMath} from "../utils/SafeMath.sol";

// forked from https://github.com/SetProtocol/index-coop-contracts/blob/master/contracts/staking/StakingRewardsV2.sol
// NOTE: V2 allows setting of rewardsDuration in constructor
contract StakingChild is
    Ownable,
    IStakingChild,
    ReentrancyGuard
{
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /* ========== STATE VARIABLES ========== */
    IStakingMaster public stakingMaster;
    IStakingCollector public stakingCollector;
    IERC20 public rewardsToken;

    uint256 public periodFinish = 0;
    uint256 public rewardRate = 0;
    bool public initialized;
    uint256 public rewardsDuration;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    function initialize(
        address _rewardsToken,
        address _stakingMaster,
        address _stakingCollector,
        uint256 _rewardsDuration
    ) external {
        require(!initialized);
        stakingCollector = IStakingCollector(_stakingCollector);
        stakingMaster = IStakingMaster(_stakingMaster);
        rewardsToken = IERC20(_rewardsToken);
        rewardsDuration = _rewardsDuration;

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp.add(rewardsDuration);

        rewardRate = rewardsToken.balanceOf(address(this)).div(rewardsDuration);

        emit DefaultInitialization();
        initialized = true;
    }

    function changeStakingMaster(address account)
        external
        override
        onlyOwner
    {
        address old = address(stakingMaster);
        stakingMaster = IStakingMaster(account);
        emit ChangeStakingMaster(old, account);
    }

    function changeStakingCollector(address account)
        external
        override
        onlyOwner
    {
        address old = address(stakingCollector);
        stakingCollector = IStakingCollector(account);
        emit ChangeStakingCollector(old, account);
    }

    function changeRewardsDuration(uint256 duration)
        external
        override
        onlyOwner
    {
        uint256 oldRewardsDuration = rewardsDuration;
        rewardsDuration = duration;
        emit ChangeRewardsDuration(oldRewardsDuration, duration);
    }

    /* ========== VIEWS ========== */

    function totalSupply() public view override returns (uint256) {
        return stakingMaster.totalSupply();
    }

    function balanceOf(address account) public view override returns (uint256) {
        return stakingMaster.balanceOf(account);
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

    function earned(address who) public view override returns (uint256) {
        return
            balanceOf(who)
                .mul(rewardPerToken().sub(userRewardPerTokenPaid[who]))
                .div(1e18)
                .add(rewards[who]);
    }

    function getRewardForDuration() external view override returns (uint256) {
        return rewardRate.mul(rewardsDuration);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function getRewardFor(address who) public override {
        require(_msgSender() == address(stakingMaster), "not master");
        _updateReward(who);

        uint256 reward = rewards[who];
        if (reward > 0) {
            rewards[who] = 0;
            rewardsToken.safeTransfer(who, reward);
            emit RewardPaid(who, reward);
        }
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function notifyRewardAmount(uint256 reward)
        external
        override
    {
        require(_msgSender() == address(stakingCollector), "not collector");
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

    function refundTokens (address token) external override onlyOwner {
        IERC20(token).transfer(owner(), IERC20(token).balanceOf(address(this)));
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

    function updateReward(address who) external override {
        // Dev: only stakingToken(MAHAX) can call this update on change to lock state.
        require(msg.sender == address(stakingMaster), "Not staking master");
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
    event ChangeStakingMaster(
        address indexed old,
        address indexed current
    );
    event ChangeStakingCollector(
        address indexed old,
        address indexed current
    );
    event ChangeRewardsDuration(
        uint256 old,
        uint256 current
    );
}
