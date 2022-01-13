# A sample file to help deployment of contracts

from brownie import (
    accounts,
    Distributor,
    accounts
)

DEPLOYER = accounts.load('0')
print('Deployer is ', DEPLOYER)
CONFS = 1


def main():
    deployer = accounts.at(DEPLOYER)

    instance = Distributor.deploy(
        "0x89DA855d94dD60396E585B19072A30397A9355A1",  # _stakingContract,
        "0x89DA855d94dD60396E585B19072A30397A9355A1",  # _poolToken,
        "0x81184ddaa2e25B848Aae8dA1DAcBb58076A1C7D8",  # _operator,
        86400,  # _period
        {"from": deployer, "required_confs": CONFS},
        publish_source=True
    )

    print("instance at", instance.address)
