# A sample file to help deployment of contracts

from brownie import (
    accounts,
    StakingCollector,
    StakingMaster,
    accounts
)

from .staking_config import (
    MAHA_ADDRESS,
    SCLP_ADDRESS,
    ARTH_ADDRESS,
    USDC_ADDRESS,
    DEPLOYED_VOTING_ESCROW,
    GNOSIS_SAFE,
    save_abi,
    save_output
)

DEPLOYER = accounts.load('0')
print('Deployer is ', DEPLOYER)
CONFS = 1


def main():
    output_file = {}
    deployer = accounts.at(DEPLOYER)

    # deploy staking master
    stakingMaster = StakingMaster.deploy(
        GNOSIS_SAFE,
        DEPLOYED_VOTING_ESCROW,
        {"from": deployer, "required_confs": CONFS},
        publish_source=True
    )

    output_file["StakingMaster"] = {
        "abi": "StakingMaster",
        "address": stakingMaster.address
    }

    save_abi(stakingMaster, "StakingMaster")
    print("stakingMaster at", stakingMaster.address)

    # # deploy staking collector
    # stakingCollector = StakingCollector.deploy(
    #     86400 * 7, # 1 week epochs
    #     {"from": deployer, "required_confs": CONFS},
    #     publish_source=True
    # )

    # output_file["StakingCollector"] = {
    #     "abi": "StakingCollector",
    #     "address": stakingCollector.address
    # }

    # save_abi(stakingCollector, "StakingCollector")
    # print("stakingCollector at", stakingCollector.address)

    save_output(output_file, "staking_01")