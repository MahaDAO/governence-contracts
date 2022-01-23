


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

    stakingMaster = "0xbFc4060006e9B142fec7dB13cA669BE1687Db274"
    StakingCollector = "0x41Ef0505EBaa70eC10F7b8EE8965E269a50cE3eE"

    rewardTokens = [
        MAHA_ADDRESS,
        SCLP_ADDRESS,
        ARTH_ADDRESS,
        USDC_ADDRESS,
    ]

    for rewardToken in rewardTokens:
        stakingChild = stakingChild.deploy(
            GNOSIS_SAFE,
            {"from": deployer, "required_confs": CONFS},
            publish_source=True
        )

        save_abi(stakingChild, "StakingChild")

        output_file["StakingChild"] = {
            "abi": "StakingChild",
            "address": stakingChild.address
        }

    print("stakingMaster at", stakingMaster.address)
