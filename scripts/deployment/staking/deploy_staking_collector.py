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
        "0x008DD21f94d4944dC85CCad0cF8003427C91996D",  # _distributor,
        86400 * 7,
        {"from": deployer, "required_confs": CONFS},
        publish_source=True
    )

    print("instance at", instance.address)
