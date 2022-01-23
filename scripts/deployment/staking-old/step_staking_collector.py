# A sample file to help deployment of contracts

from decimal import Decimal
from brownie import (
    accounts,
    StakingCollector,
    Contract,
    accounts
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
    instance = Contract.from_abi("StakingCollector", '0x39932928416dCbA481Ef73E620fD99165073Bcf7', StakingCollector.abi)

    mahaPrice = 6.06 * 1e18
    sclpPrice = 1.97 * 1e18

    tokens = [
        '0xedd6ca8a4202d4a36611e2fff109648c4863ae19', # maha,
        '0x2fc711518aae7c87d7002566c5d43b0e5d2b1932' # scallop
    ]

    # considering weekly rates;
    usdPrices18 = [
        str(Decimal(mahaPrice)), # 60k MAHA/ year / 52 weeks
        str(Decimal(sclpPrice)) # 1mn SCLP/ year / 52 weeks
    ]

    repeat(
        instance.step,
        tokens,
        usdPrices18,
        {"from": deployer, "required_confs": CONFS}
    )
