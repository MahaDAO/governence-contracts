import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress } from "../utils";

async function main() {
  console.log(`Deploying to ${network.name}...`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}.`);

  const gnosisTeam = "0x6357EDbfE5aDA570005ceB8FAd3139eF5A8863CC";
  const gnosisCommunity = "0x516bd18Ba17f70f08C8C91fE7F9Ee2105DC275d2";
  const vetoGovernor = await getOutputAddress("MAHAXVetoGovernor");

  const delay = 86400 * 30;

  await deployOrLoadAndVerify(
    "MAHATimelockController-30d",
    "MAHATimelockController",
    [
      delay, // uint256 minDelay,
      gnosisTeam, // address admin,
      [], // address[] memory proposers,
      [vetoGovernor, gnosisCommunity], // address[] memory cancellors,
      [gnosisTeam, vetoGovernor, gnosisCommunity], // address[] memory executors
    ]
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
