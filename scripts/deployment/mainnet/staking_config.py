import json

# NOTE:- Please change this address. This will be the
# admin for proxy contract. This cannot call the fallback/delegate function via proxy.
PROXY_ADMIN = "0x112ae96ce47f9506cdc4668655ae1ad880109d5c"

ARTH_ADDRESS = "0xe52509181feb30eb4979e29ec70d50fd5c44d590"
USDC_ADDRESS = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"
MAHA_ADDRESS = "0xedd6ca8a4202d4a36611e2fff109648c4863ae19"
ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

DEPLOYED_VOTING_ESCROW = "0x0d13059C8c74cC371EdB290614FCbBa97acc8d89"

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
