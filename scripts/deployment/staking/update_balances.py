# A sample file to help deployment of contracts

from math import ceil
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

    stakingMasterInstance = Contract.from_abi("StakingMaster", stakingMaster, StakingMaster.abi)
    print("updated pools in staking master")

    f = open("output/mahax_addresses.txt","r")
    lines = f.readlines()

    addresses = [l.replace('\n', '') for l in lines]

    # process 100 addresses at a time
    gap = 100
    for i in range(0, ceil(len(addresses) / gap)):
        print('working on', i, i * gap, gap * (i + 1))
        addresses_snip = addresses[i * gap: gap * (i + 1)]

        stakingMasterInstance.updateRewardForMultiple(addresses_snip, {"from": deployer, "required_confs": CONFS})
        print('done with', i)