# Testnet deployment script

import json

from brownie import (
    accounts,
    ERC20,
    VotingEscrow,
    accounts,
    BasicStaking,
    NonStakableVotingEscrow,
    AdminUpgradeabilityProxy,
    Contract,
    PoolToken
)


USE_STRATEGIES = False  # Needed for the ganache-cli tester which doesn't like middlewares
POA = True

DEPLOYER = accounts.load('0')
print('Deployer is ', DEPLOYER)
ARAGON_AGENT = "0x330f46D965469a3D1D419b426df0f45b06c625ad"

DISTRIBUTION_AMOUNT = 10 ** 6 * 10 ** 18
DISTRIBUTION_ADDRESSES = [
    "0x39415255619783A2E71fcF7d8f708A951d92e1b6",
    "0x6cd85bbb9147b86201d882ae1068c67286855211",
]
VESTING_ADDRESSES = ["0x6637e8531d68917f5Ec31D6bA5fc80bDB34d9ef1", "0xDDc09B681fD9c9D428690Df42a8C544458508d84"]

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

CONFS = 1


def repeat(f, *args, **kwargs):
    """
    Repeat when geth is not broadcasting (unaccounted error)
    """
    while True:
        try:
            return f(*args, **kwargs)
        except KeyError:
            continue


def save_abi(contract, name):
    with open("./output/abi/%s.json" % name, "w") as f:
        json.dump(contract.abi, f, indent=4)


def save_output(deployment, name):
    with open("./output/%s.json" % name, "w") as f:
        json.dump(deployment, f, indent=4)


def main():
    output_file = {}
    deployer = accounts.at(DEPLOYER)

    token = repeat(
        ERC20.deploy, 
        "Maha DAO Token", 
        "MAHA", 
        18, 
        1303030303,
        {"from": deployer, "required_confs": CONFS}
    )

    save_abi(token, "MahaToken")
    output_file["MahaToken"] = {
        "abi": "MahaToken",
        "address": token.address
    }

    escrow_without_proxy = repeat(
        NonStakableVotingEscrow.deploy,
        {"from": deployer, "required_confs": CONFS}
    )
    stakeable_escrow_without_proxy = repeat(
        VotingEscrow.deploy,
        {"from": deployer, "required_confs": CONFS}
    )

    proxy = repeat(
        AdminUpgradeabilityProxy.deploy,
        stakeable_escrow_without_proxy,
        ARAGON_AGENT,
        bytes(),
        {"from": deployer, "required_confs": CONFS}
    )
    escrow_with_proxy = Contract.from_abi('VotingEscrow', proxy, VotingEscrow.abi)
    
    print('Fetching values from Proxy for VotingEscrow before initializing')
    print('- WEEK = ', escrow_with_proxy.WEEK())
    print('- INCREASE_LOCK_AMOUNT = ', escrow_with_proxy.INCREASE_LOCK_AMOUNT())
    print()

    save_abi(escrow_with_proxy, "VotingEscrow")
    output_file["VotingEscrow"] = {
        "abi": "VotingEscrow",
        "address": escrow_with_proxy.address
    }

    repeat(
        escrow_with_proxy.initialize,
        token,
        "Vote-escrowed MAHA",
        "MAHAX",
        "maha_0.99",
        {"from": deployer, "required_confs": CONFS}
    )
    repeat(
        escrow_with_proxy.changeController, 
        ARAGON_AGENT, 
        {"from": deployer, "required_confs": CONFS}
    )

    print('Fetching values from Proxy for VotingEscrow before initializing')
    print('- WEEK = ', escrow_with_proxy.WEEK())
    print('- INCREASE_LOCK_AMOUNT = ', escrow_with_proxy.INCREASE_LOCK_AMOUNT())
    print()

    test_token_a = repeat(
        ERC20.deploy, 
        "PoolTokenA", 
        "PLTKN-A", 
        18, 
        1303030303,
        {"from": deployer, "required_confs": CONFS}
    )

    test_token_b = repeat(
        ERC20.deploy, 
        "PoolTokenB", 
        "PLTKN-B", 
        18, 
        1303030303,
        {"from": deployer, "required_confs": CONFS}
    )

    pool_token = repeat(
        PoolToken.deploy,
        "PoolToken",
        "PLTKN",
        [test_token_a, test_token_b],
        deployer,
        deployer,
        {"from": deployer, "required_confs": CONFS}
    )

    repeat(test_token_a.transfer, pool_token, 10000 * 1e18, {"from": deployer, "required_confs": CONFS})
    repeat(test_token_b.transfer, pool_token, 10000 * 1e18, {"from": deployer, "required_confs": CONFS})

    basic_staking = repeat(
        BasicStaking.deploy,
        deployer,
        pool_token,
        escrow_with_proxy,
        24 * 60 * 60,  # 1 Day.
        {"from": deployer, "required_confs": CONFS}
    )

    repeat(pool_token.transfer, basic_staking, 10000 * 1e18, {"from": deployer, "required_confs": CONFS})
    repeat(basic_staking.notifyRewardAmount, 10000 * 1e18, {"from": deployer, "required_confs": CONFS})
    
    repeat(escrow_with_proxy.set_staking_contract, basic_staking, {"from": deployer, "required_confs": CONFS})
    
    repeat(
        basic_staking.initializeDefault,
        {"from": deployer, "required_confs": CONFS}
    )

    save_abi(basic_staking, "BasicStaking")
    output_file["MAHAXBasicStaking"] = {
        "abi": "BasicStaking",
        "address": basic_staking.address
    }

    save_output(output_file, 'maticMumbai')
   