import json

# NOTE:- Please change this address. This will be the
# admin for proxy contract. This cannot call the fallback/delegate function via proxy.
PROXY_ADMIN = "0x112ae96ce47f9506cdc4668655ae1ad880109d5c"

GNOSIS_SAFE = "0xa1bc5163FADAbE25880897C95d3701ed388A2AA0"

ARTH_ADDRESS = "0xe52509181feb30eb4979e29ec70d50fd5c44d590"
USDC_ADDRESS = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"
MAHA_ADDRESS = "0xedd6ca8a4202d4a36611e2fff109648c4863ae19"
SCLP_ADDRESS = "0x2fc711518aae7c87d7002566c5d43b0e5d2b1932"

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

DEPLOYED_POOL_TOKEN = "0x48202b3f81e345c8F72aae88cC386dD1fbBeab97"
DEPLOYED_VOTING_ESCROW = "0x8f2c37d2f8ae7bce07aa79c768cc03ab0e5ae9ae"

STAKING_DURATION = 86400 * 7

def repeat(f, *args, **kwargs):
    """
    Repeat when geth is not broadcasting (unaccounted error)
    """
    while True:
        try:
            return f(*args, **kwargs)
        except KeyError:
            continue


def save_abi(contract, name):
    with open("./output/abi/%s.json" % name, "w") as f:
        json.dump(contract.abi, f, indent=4)


def save_output(deployment, name):
    with open("./output/%s.json" % name, "w") as f:
        json.dump(deployment, f, indent=4)
