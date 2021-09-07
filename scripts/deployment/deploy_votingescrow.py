# Testnet deployment script

import json
import time

from brownie import (
    accounts,
    ERC20,
    ERC20LP,
    ERC20CRV,
    CurvePool,
    CurveRewards,
    GaugeController,
    LiquidityGauge,
    LiquidityGaugeReward,
    Minter,
    PoolProxy,
    VestingEscrow,
    VotingEscrow,
    accounts,
    web3,
    AdminUpgradeabilityProxy,
    Contract
)
from web3 import middleware
from web3.gas_strategies.time_based import fast_gas_price_strategy as gas_strategy

USE_STRATEGIES = False  # Needed for the ganache-cli tester which doesn't like middlewares
POA = True

DEPLOYER = accounts.load('0')
print('Deployer', DEPLOYER)
#network = sys.argv[4]

#DEPLOYER = "0xFD3DeCC0cF498bb9f54786cb65800599De505706"
ARAGON_AGENT = "0xc6Fe899dBc7F99443E0dF05EBEBbAF7FC7C82bab"

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


def deploy_erc20s_and_pool(deployer):
    coin_a = repeat(ERC20.deploy, "Coin A", "USDA", 18, 100, {"from": deployer, "required_confs": CONFS})
    repeat(
        coin_a.mint, deployer, 10 ** 9 * 10 ** 18, {"from": deployer, "required_confs": CONFS}
    )
    coin_b = repeat(ERC20.deploy, "Coin B", "USDB", 18, 100, {"from": deployer, "required_confs": CONFS})
    repeat(
        coin_b.mint, deployer, 10 ** 9 * 10 ** 18, {"from": deployer, "required_confs": CONFS}
    )

    lp_token = repeat(
        ERC20LP.deploy, "Some pool", "cPool", 18, 0, {"from": deployer, "required_confs": CONFS}
    )
    save_abi(lp_token, "lp_token")
    pool = repeat(
        CurvePool.deploy,
        [coin_a, coin_b],
        lp_token,
        100,
        4 * 10 ** 6,
        {"from": deployer, "required_confs": CONFS},
    )
    save_abi(pool, "curve_pool")
    repeat(lp_token.set_minter, pool, {"from": deployer, "required_confs": CONFS})

    # registry = repeat(
    #     Registry.deploy, [ZERO_ADDRESS] * 4, {"from": deployer, "required_confs": CONFS}
    # )
    # save_abi(registry, "registry")

    for account in DISTRIBUTION_ADDRESSES:
        repeat(
            coin_a.transfer,
            account,
            DISTRIBUTION_AMOUNT,
            {"from": deployer, "required_confs": CONFS},
        )
        repeat(
            coin_b.transfer,
            account,
            DISTRIBUTION_AMOUNT,
            {"from": deployer, "required_confs": CONFS},
        )

    repeat(
        pool.commit_transfer_ownership, ARAGON_AGENT, {"from": deployer, "required_confs": CONFS}
    )
    repeat(pool.apply_transfer_ownership, {"from": deployer, "required_confs": CONFS})

    return [lp_token, coin_a]


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
        VotingEscrow.deploy,
        {"from": deployer, "required_confs": CONFS}
    )
    
    # proxy = repeat(
    #     AdminUpgradeabilityProxy.deploy,
    #     escrow_without_proxy,
    #     ARAGON_AGENT,
    #     bytes(),
    #     {"from": deployer, "required_confs": CONFS}
    # )
    # escrow_with_proxy = Contract.from_abi('VotingEscrow', proxy, VotingEscrow.abi)
    # print('WEEk', escrow_with_proxy.WEEK())
    # print('INCREASE_LOCK_AMOUNT', escrow_with_proxy.INCREASE_LOCK_AMOUNT())
    # print('Supply', escrow_with_proxy.supply())

    save_abi(escrow_without_proxy, "VotingEscrowW")
    output_file["VotingEscrowWithProxy"] = {
        "abi": "VotingEscrow",
        "address": escrow_without_proxy.address
    }

    repeat(
        escrow_without_proxy.initialize,
        token,
        "Vote-escrowed MAHA",
        "MAHAX",
        "maha_0.99",
        {"from": deployer, "required_confs": CONFS}
    )
    repeat(
        escrow_without_proxy.changeController, 
        ARAGON_AGENT, 
        {"from": deployer, "required_confs": CONFS}
    )

    print('WEEk', escrow_without_proxy.WEEK())
    print('INCREASE_LOCK_AMOUNT', escrow_without_proxy.INCREASE_LOCK_AMOUNT())
    print('Supply', escrow_without_proxy.supply())
    save_output(output_file, 'maticMumbai')
    