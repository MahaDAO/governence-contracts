# A sample file to help deployment of contracts

from brownie import (
    accounts,
    StakingDistributor,
    accounts
)

DEPLOYER = accounts.load('0')
print('Deployer is ', DEPLOYER)
CONFS = 1


def main():
    deployer = accounts.at(DEPLOYER)

    instance = StakingDistributor.deploy(
        "0x89DA855d94dD60396E585B19072A30397A9355A1",  # _stakingContract,
        "0x48202b3f81e345c8f72aae88cc386dd1fbbeab97",  # _poolToken,
        {"from": deployer, "required_confs": CONFS},
        publish_source=True
    )

    print("instance at", instance.address)
