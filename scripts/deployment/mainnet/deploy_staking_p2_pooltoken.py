from brownie import (
    accounts,
    VotingEscrow,
    accounts,
    BasicStaking,
    Contract,
    PoolToken
)

from staking_config import (
    MAHA_ADDRESS,
    ARTH_ADDRESS,
    USDC_ADDRESS,
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

    # output_file["SCLP"] = {
    #     "abi": "IERC20",
    #     "address": ''
    # }

    pool_token = repeat(
        PoolToken.deploy,
        "PoolToken",
        "PLTKN",
        [ARTH_ADDRESS, USDC_ADDRESS, MAHA_ADDRESS],
        deployer,
        deployer,
        {"from": deployer, "required_confs": CONFS}
    )

    output_file["PoolToken"] = {
        "abi": "IERC20",
        "address": pool_token.address
    }

    # fund the pool tokens
    # repeat(token.transfer, pool_token, 10000 * 1e18, {"from": deployer, "required_confs": CONFS})
    # repeat(arth.transfer, pool_token, 10000 * 1e18, {"from": deployer, "required_confs": CONFS})
    # repeat(sclp.transfer, pool_token, 10000 * 1e18, {"from": deployer, "required_confs": CONFS})
    # repeat(usdc.transfer, pool_token, 10000 * 1e6, {"from": deployer, "required_confs": CONFS})

    basic_staking = repeat(
        BasicStaking.deploy,
        deployer,
        pool_token,
        DEPLOYED_VOTING_ESCROW,
        24 * 60 * 60,  # 1 day.
        {"from": deployer, "required_confs": CONFS}
    )

    voting_escrow = VotingEscrow.at(DEPLOYED_VOTING_ESCROW)

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
