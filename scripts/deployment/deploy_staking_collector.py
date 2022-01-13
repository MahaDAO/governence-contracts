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
        "0x4040E361DfC8426c5229867d018cAcD619aE5921",  # _distributor,
        86400,
        {"from": deployer, "required_confs": CONFS},
        publish_source=True
    )

    print("instance at", instance.address)
