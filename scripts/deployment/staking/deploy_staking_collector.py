# A sample file to help deployment of contracts

from brownie import (
    accounts,
    StakingCollector,
    accounts
)

DEPLOYER = accounts.load('0')
print('Deployer is ', DEPLOYER)
CONFS = 1


def main():
    deployer = accounts.at(DEPLOYER)

    instance = StakingCollector.deploy(
        "0xCD732777f330eCa5c1c7A0Ac50eA89123d9EBAf1",  # _distributor,
        86400,
        {"from": deployer, "required_confs": CONFS},
        publish_source=True
    )

    print("instance at", instance.address)
