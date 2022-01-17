# A sample file to help deployment of contracts

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
    instance = Contract.from_abi("StakingCollector", '0x1894dFbEE996502220E2BE203B8e9830622113D9', StakingCollector.abi)

    tokens = [
        '0xedd6ca8a4202d4a36611e2fff109648c4863ae19', # maha,
        '0x2fc711518aae7c87d7002566c5d43b0e5d2b1932' # scallop
    ]

    # considering weekly rates;
    rates = [
        '1154000000000000000000', # 60k MAHA/ year / 52 weeks
        '19231000000000000000000' # 1mn SCLP/ year / 52 weeks
    ]

    repeat(
        instance.setEpochRates,
        tokens,
        rates,
        {"from": deployer, "required_confs": CONFS}
    )
