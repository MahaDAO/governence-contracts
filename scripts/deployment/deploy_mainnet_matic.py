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
# Note :- Please change this address
ARAGON_AGENT = ""

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

    token = ""
    output_file["MahaToken"] = {
        "abi": "MahaToken",
        "address": token
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
        {"from": deployer, "required_confs": CONFS}
    )
    escrow_with_proxy = Contract.from_abi('VotingEscrow', proxy, VotingEscrow.abi)
    print('WEEk', escrow_with_proxy.WEEK())
    print('INCREASE_LOCK_AMOUNT', escrow_with_proxy.INCREASE_LOCK_AMOUNT())
    print('Supply', escrow_with_proxy.supply())

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

    print('WEEk', escrow_with_proxy.WEEK())
    print('INCREASE_LOCK_AMOUNT', escrow_with_proxy.INCREASE_LOCK_AMOUNT())
    print('Supply', escrow_with_proxy.supply())
    save_output(output_file, 'maticMumbai')
   