from brownie import (
    accounts,
    VotingEscrowV1,
    accounts,
    PoolToken,
    BasicStaking,
    AdminUpgradeabilityProxy,
    Contract
)

from .staking_config import (

    PROXY_ADMIN,
    DEPLOYED_POOL_TOKEN,
    DEPLOYED_VOTING_ESCROW,
    save_abi,
    save_output,
    repeat
)

DEPLOYER = accounts.load('0')
print('Deployer is ', DEPLOYER)
CONFS = 1


def main():
    output_file = {}
    deployer = accounts.at(DEPLOYER)

    voting_escrow = Contract.from_abi("VotingEscrowV1", DEPLOYED_VOTING_ESCROW, VotingEscrowV1.abi)
    pool_token = Contract.from_abi("PoolToken", DEPLOYED_POOL_TOKEN, PoolToken.abi)

    basic_staking_without_proxy = BasicStaking.deploy(
        {"from": deployer, "required_confs": CONFS},
        publish_source=True
    )
    print("instance at", basic_staking_without_proxy.address)

    proxy = repeat(
        AdminUpgradeabilityProxy.deploy,
        basic_staking_without_proxy,
        PROXY_ADMIN,
        bytes(),
        {"from": deployer, "required_confs": CONFS}
    )

    print("proxy at", proxy.address)

    basic_staking = Contract.from_abi('basic_staking_without_proxy', proxy, basic_staking_without_proxy.abi)

    repeat(
        basic_staking.initialize,
        deployer,
        pool_token,
        DEPLOYED_VOTING_ESCROW,
        24 * 60 * 60,  # 1 day.
        {"from": deployer, "required_confs": CONFS}
    )

    repeat(pool_token.transfer, basic_staking, 10000 * 1e18, {"from": deployer, "required_confs": CONFS})
    repeat(basic_staking.notifyRewardAmount, 10000 * 1e18, {"from": deployer, "required_confs": CONFS})
    repeat(voting_escrow.set_staking_contract, basic_staking, {"from": deployer, "required_confs": CONFS})

    repeat(
        basic_staking.initializeDefault,
        {"from": deployer, "required_confs": CONFS}
    )

    save_abi(basic_staking, "BasicStaking")
    output_file["MAHAXBasicStaking"] = {
        "abi": "BasicStaking",
        "address": basic_staking.address
    }

    save_output(output_file, 'StakingContract')
