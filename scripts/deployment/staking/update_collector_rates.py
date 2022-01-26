# A sample file to help deployment of contracts

from decimal import Decimal
from brownie import (
    accounts,
    StakingCollector,
    Contract,
    accounts
)

from .staking_config import (
    MAHA_ADDRESS,
    SCLP_ADDRESS,
    ARTH_ADDRESS,
    USDC_ADDRESS,
)

DEPLOYER = accounts.load('0')
print('Deployer is ', DEPLOYER)
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


def main():
    deployer = accounts.at(DEPLOYER)
    instance = Contract.from_abi("StakingCollector", '0x41Ef0505EBaa70eC10F7b8EE8965E269a50cE3eE', StakingCollector.abi)

    tokens = [
        {
            "address": MAHA_ADDRESS, # maha
            "rate": 1154 * 1000000000000000000, # 1154 MAHA / week
            "stakingPool": "0x63e47D50711E877167dfE465083E37C4ac53055a"
        },
        {
            "address": SCLP_ADDRESS, # sclp
            "rate": 19231 * 1000000000000000000, # 19,231 SCLP / week
            "stakingPool": "0xc1fCf0c56D52875d473811ff0A1C00E21c51b1B5"
        },
        {
            "address": ARTH_ADDRESS, # arth
            "rate": 0, # infinite arth
            "stakingPool": "0x7fD234901B1E5D475a7d3B275dd7c61CABE10E97"
        },
        {
            "address": USDC_ADDRESS, # usdc
            "rate": 0, # infinite usdc
            "stakingPool": "0xe4d3751eC968C032FD1eAD222f34707e7f031E72"
        },
    ]

    for token in tokens:
        instance.registerToken(token["address"], token["rate"], token["stakingPool"], {"from": deployer, "required_confs": CONFS})
