# A sample file to help deployment of contracts

from brownie import (
    accounts,
    StakingChild,
    StakingMaster,
    Contract,
    accounts
)

DEPLOYER = accounts.load('0')
print('Deployer is ', DEPLOYER)
CONFS = 1


def main():
    deployer = accounts.at(DEPLOYER)

    stakingMaster = "0x2A959e264BC4eAFB844A38474121C06750008E8c"
    stakingCollector = "0x41Ef0505EBaa70eC10F7b8EE8965E269a50cE3eE"

    children = [
        "0x63e47D50711E877167dfE465083E37C4ac53055a", # maha
        "0xc1fCf0c56D52875d473811ff0A1C00E21c51b1B5", # sclp
        "0x7fD234901B1E5D475a7d3B275dd7c61CABE10E97", # arth
        "0xe4d3751eC968C032FD1eAD222f34707e7f031E72", # usdc
    ]

    stakingMasterInstance = Contract.from_abi("StakingMaster", stakingMaster, StakingMaster.abi)
    stakingMasterInstance.addPools(children, {"from": deployer, "required_confs": CONFS})
    print("updated pools in staking master")

    for child in children:
        print('initializing', child)
        instance = Contract.from_abi("StakingChild", child, StakingChild.abi)

        instance.changeStakingMaster(stakingMaster, {"from": deployer, "required_confs": CONFS})
        instance.initialize({"from": deployer, "required_confs": CONFS})

        print('done with', child)

    # instance = StakingDistributor.deploy(
    #     "0x89DA855d94dD60396E585B19072A30397A9355A1",  # _stakingContract,
    #     "0x48202b3f81e345c8f72aae88cc386dd1fbbeab97",  # _poolToken,
    #     {"from": deployer, "required_confs": CONFS},
    #     publish_source=True
    # )

    # print("instance at", instance.address)
