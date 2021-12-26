from brownie import (
    accounts,
    VotingEscrowV1,
    accounts,
    BasicStaking,
    AdminUpgradeabilityProxy,
    Contract,
    PoolToken
)

from .staking_config import (
    MAHA_ADDRESS,
    ARTH_ADDRESS,
    USDC_ADDRESS,
    PROXY_ADMIN,
    SCLP_ADDRESS,
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


    output_file["MahaToken"] = {
        "abi": "IERC20",
        "address": MAHA_ADDRESS
    }

    output_file["ARTH"] = {
        "abi": "IERC20",
        "address": ARTH_ADDRESS
    }

    output_file["USDC"] = {
        "abi": "IERC20",
        "address": USDC_ADDRESS
    }

    output_file["SCLP"] = {
        "abi": "IERC20",
        "address": SCLP_ADDRESS
    }

    pool_token = repeat(
        PoolToken.deploy,
        "PoolToken",
        "MAHAX-PL",
        [ARTH_ADDRESS, USDC_ADDRESS, MAHA_ADDRESS, SCLP_ADDRESS],
        deployer,
        deployer,
        {"from": deployer, "required_confs": CONFS}
    )

    print("pool token deployed")

    output_file["PoolToken"] = {
        "abi": "IERC20",
        "address": pool_token.address
    }

    # fund the pool tokens
    # repeat(token.transfer, pool_token, 10000 * 1e18, {"from": deployer, "required_confs": CONFS})
    # repeat(arth.transfer, pool_token, 10000 * 1e18, {"from": deployer, "required_confs": CONFS})
    # repeat(sclp.transfer, pool_token, 10000 * 1e18, {"from": deployer, "required_confs": CONFS})
    # repeat(usdc.transfer, pool_token, 10000 * 1e6, {"from": deployer, "required_confs": CONFS})

    basic_staking_without_proxy = repeat(
        BasicStaking.deploy,
        {"from": deployer, "required_confs": CONFS}
    )


    proxy = repeat(
        AdminUpgradeabilityProxy.deploy,
        basic_staking_without_proxy,
        PROXY_ADMIN,
        bytes(),
        {"from": deployer, "required_confs": CONFS}
    )
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
