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
#network = sys.argv[4]

#DEPLOYER = "0xFD3DeCC0cF498bb9f54786cb65800599De505706"
ARAGON_AGENT = "0x0A39a28636fC40c5C978B3322aD7320fcf154FAF"

DISTRIBUTION_AMOUNT = 10 ** 6 * 10 ** 18
DISTRIBUTION_ADDRESSES = [
    "0x39415255619783A2E71fcF7d8f708A951d92e1b6",
    "0x6cd85bbb9147b86201d882ae1068c67286855211",
]
VESTING_ADDRESSES = ["0x6637e8531d68917f5Ec31D6bA5fc80bDB34d9ef1", "0xDDc09B681fD9c9D428690Df42a8C544458508d84"]

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

CONFS = 1


def repeat(f, *args):
    """
    Repeat when geth is not broadcasting (unaccounted error)
    """
    while True:
        try:
            return f(*args)
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

    # if USE_STRATEGIES:
    #     web3.eth.setGasPriceStrategy(gas_strategy)
    #     web3.middleware_onion.add(middleware.time_based_cache_middleware)
    #     web3.middleware_onion.add(middleware.latest_block_based_cache_middleware)
    #     web3.middleware_onion.add(middleware.simple_cache_middleware)
    #     if POA:
    #         web3.middleware_onion.inject(middleware.geth_poa_middleware, layer=0)

    # # deploy pools and gauges

    # coin_a = repeat(ERC20.deploy, "Coin A", "USDA", 18, 100, {"from": deployer, "required_confs": CONFS})
    # output_file['USDA'] = {
    #     "abi": 'IERC20',
    #     "address": coin_a.address
    # }
    # repeat(
    #     coin_a.mint, deployer, 10 ** 9 * 10 ** 18, {"from": deployer, "required_confs": CONFS}
    # )

    # coin_b = repeat(ERC20.deploy, "Coin B", "USDB", 18, 100, {"from": deployer, "required_confs": CONFS})
    # repeat(
    #     coin_b.mint, deployer, 10 ** 9 * 10 ** 18, {"from": deployer, "required_confs": CONFS}
    # )
    # output_file['USDB'] = {
    #     "abi": 'IERC20',
    #     "address": coin_b.address
    # }

    # lp_token = repeat(
    #     ERC20LP.deploy, "Some pool", "cPool", 18, 0, {"from": deployer, "required_confs": CONFS}
    # )
    # output_file['LPToken'] = {
    #     "abi": 'IERC20',
    #     "address": lp_token.address
    # }
    # save_abi(lp_token, "lp_token")

    # pool = repeat(
    #     CurvePool.deploy,
    #     [coin_a, coin_b],
    #     lp_token,
    #     100,
    #     4 * 10 ** 6,
    #     {"from": deployer, "required_confs": CONFS},
    # )
    # save_abi(pool, "curve_pool")
    # output_file['pool'] = {
    #     "abi": 'IERC20',
    #     "address": pool.address
    # }

    # repeat(lp_token.set_minter, pool, {"from": deployer, "required_confs": CONFS})

    # repeat(
    #     coin_a.transfer,
    #     "0x6cd85bbb9147b86201d882ae1068c67286855211",
    #     DISTRIBUTION_AMOUNT,
    #     {"from": deployer, "required_confs": CONFS},
    # )
    # repeat(
    #     coin_b.transfer,
    #     "0x6cd85bbb9147b86201d882ae1068c67286855211",
    #     DISTRIBUTION_AMOUNT,
    #     {"from": deployer, "required_confs": CONFS},
    # )

    # contract = repeat(
    #     CurveRewards.deploy, lp_token, coin_a, {"from": accounts[0], "required_confs": CONFS}
    # )
    # repeat(
    #     contract.setRewardDistribution, accounts[0], {"from": accounts[0], "required_confs": CONFS}
    # )
    # repeat(coin_a.transfer, contract, 100e18, {"from": accounts[0], "required_confs": CONFS})

    # liquidity_gauge_rewards = repeat(
    #     LiquidityGaugeReward.deploy,
    #     lp_token,
    #     "0xbE45e0E4a72aEbF9D08F93E64701964d2CC4cF96",
    #     contract,
    #     coin_a,
    #     DEPLOYER,
    #     {"from": deployer, "required_confs": CONFS}
    # )

    # coins = deploy_erc20s_and_pool(deployer)

    # lp_token = coins[0]
    # coin_a = coins[1]

    token = repeat(
        ERC20.deploy, 
        "Curve DAO Token", 
        "CRV", 
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
    proxy = repeat(
        AdminUpgradeabilityProxy.deploy,
        escrow_without_proxy,
        ARAGON_AGENT,
        bytes(),
        {"from": deployer, "required_confs": CONFS},
    )
    escrow_with_proxy = Contract.from_abi('VotingEscrow', proxy, VotingEscrow.abi)
    save_abi(escrow_with_proxy, "VotingEscrow")
    output_file["VotingEscrow"] = {
        "abi": "VotingEscrow",
        "address": escrow_with_proxy.address
    }

    repeat(
        escrow_with_proxy.initialize,
        token,
        "Vote-escrowed CRV",
        "veCRV",
        "veCRV_0.99",
        {"from": deployer, "required_confs": CONFS}
    )
    repeat(
        escrow_with_proxy.changeController, 
        ARAGON_AGENT, 
        {"from": deployer, "required_confs": CONFS}
    )

    save_output(output_file, 'maticMumbai')

    # for account in DISTRIBUTION_ADDRESSES:
    #     repeat(
    #         token.transfer,
    #         account,
    #         DISTRIBUTION_AMOUNT,
    #         {"from": deployer, "required_confs": CONFS},
    #     )

    # gauge_controller = repeat(
    #     GaugeController.deploy, token, escrow_with_proxy, {"from": deployer, "required_confs": CONFS}
    # )
    # save_abi(gauge_controller, "gauge_controller")

    # minter = repeat(
    #     Minter.deploy, token, gauge_controller, {"from": deployer, "required_confs": CONFS}
    # )
    # save_abi(minter, "minter")

    # liquidity_gauge = repeat(
    #     LiquidityGauge.deploy, lp_token, minter, deployer, {"from": deployer, "required_confs": CONFS}
    # )
    # save_abi(liquidity_gauge, "liquidity_gauge")

    # contract = repeat(
    #     CurveRewards.deploy, lp_token, coin_a, {"from": accounts[0], "required_confs": CONFS}
    # )
    # repeat(
    #     contract.setRewardDistribution, accounts[0], {"from": accounts[0], "required_confs": CONFS}
    # )
    # repeat(coin_a.transfer, contract, 100e18, {"from": accounts[0], "required_confs": CONFS})

    # liquidity_gauge_rewards = repeat(
    #     LiquidityGaugeReward.deploy,
    #     lp_token,
    #     minter,
    #     contract,
    #     coin_a,
    #     DEPLOYER,
    #     {"from": deployer, "required_confs": CONFS}
    # )

    # #repeat(token.set_minter, minter, {"from": deployer, "required_confs": CONFS})
    # repeat(gauge_controller.add_type, b"Liquidity", {"from": deployer, "required_confs": CONFS})
    # repeat(
    #     gauge_controller.change_type_weight,
    #     0,
    #     10 ** 18,
    #     {"from": deployer, "required_confs": CONFS},
    # )
    # repeat(
    #     gauge_controller.add_gauge,
    #     liquidity_gauge,
    #     0,
    #     10 ** 18,
    #     {"from": deployer, "required_confs": CONFS},
    # )

    # repeat(
    #     gauge_controller.add_type, b"LiquidityRewards", {"from": deployer, "required_confs": CONFS}
    # )
    # repeat(
    #     gauge_controller.change_type_weight,
    #     1,
    #     10 ** 18,
    #     {"from": deployer, "required_confs": CONFS},
    # )
    # repeat(
    #     gauge_controller.add_gauge,
    #     liquidity_gauge_rewards,
    #     1,
    #     10 ** 18,
    #     {"from": deployer, "required_confs": CONFS},
    # )

    # repeat(
    #     gauge_controller.commit_transfer_ownership,
    #     ARAGON_AGENT,
    #     {"from": deployer, "required_confs": CONFS},
    # )
    # repeat(gauge_controller.apply_transfer_ownership, {"from": deployer, "required_confs": CONFS})
    # # repeat(
    # #     escrow_with_proxy.commit_transfer_ownership, ARAGON_AGENT, {"from": deployer, "required_confs": CONFS}
    # # )
    # repeat(escrow_with_proxy.apply_transfer_ownership, {"from": deployer, "required_confs": CONFS})

    # repeat(PoolProxy.deploy, deployer, deployer, deployer, {"from": deployer, "required_confs": CONFS})

    # vesting = repeat(
    #     VestingEscrow.deploy,
    #     token,
    #     time.time() + 300,
    #     time.time() + 2000,
    #     False,
    #     [
    #         deployer,
    #         deployer,
    #         deployer,
    #         deployer
    #     ],
    #     {"from": deployer, "required_confs": CONFS}
    # )
    # save_abi(vesting, "vesting")

    # # repeat(token.approve, vesting, 100000e18, {"from": deployer, "required_confs": CONFS})
    # # repeat(
    # #     vesting.fund,
    # #     VESTING_ADDRESSES + ["0x0000000000000000000000000000000000000000"] * 98,
    # #     ([1000e18] * 2) + [0] * 98,
    # #     {"from": deployer, "required_confs": CONFS},
    # # )
