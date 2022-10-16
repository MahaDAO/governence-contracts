import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress } from "../utils";

async function main() {
  console.log(`Deploying to ${network.name}...`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}.`);

  const gnosis = "0x6357EDbfE5aDA570005ceB8FAd3139eF5A8863CC";
  const gnosisCommunity = "0x516bd18Ba17f70f08C8C91fE7F9Ee2105DC275d2";
  const governor = await getOutputAddress("MAHAXGovernor");
  const vetoGovernor = await getOutputAddress("MAHAXVetoGovernor");

  const delay = 86400 * 14;

  await deployOrLoadAndVerify(
    "MAHATimelockController",
    "MAHATimelockController",
    [
      delay, // uint256 minDelay,
      gnosis, // address admin,
      [governor], // address[] memory proposers,
      [vetoGovernor, gnosisCommunity], // address[] memory cancellors,
      [gnosis, vetoGovernor, gnosisCommunity], // address[] memory executors
    ]
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
