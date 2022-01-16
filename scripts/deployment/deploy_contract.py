# A sample file to help deployment of contracts

from brownie import (
    accounts,
    BasicStaking,
)

DEPLOYER = accounts.load('0')
print('Deployer is ', DEPLOYER)
CONFS = 1


def main():
    deployer = accounts.at(DEPLOYER)

    instance = BasicStaking.deploy(
        {"from": deployer, "required_confs": CONFS},
        publish_source=True
    )
    print("instance at", instance.address)
