import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress } from "../utils";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";

async function main() {
  console.log(`deploying to ${network.name}`);

  const address = "0xeccE08c2636820a81FC0c805dBDC7D846636bbc4";
  await helpers.impersonateAccount(address);
  const deployer = await ethers.getSigner(address);

  console.log(`Deployer address is ${deployer.address}`);

  // Get all the deployed smart contracts.
  const registry = await getOutputAddress("Registry", "ethereum");

  const kicker = await deployOrLoadAndVerify("OpenseaKicker", "OpenseaKicker", [
    "0x00000000006c3852cbEf3e08E8dF289169EdE581", // opensea seaport
    registry,
  ]);

  const order = {
    // OrderParameters parameters;
    offerer: "0xD4E5D6DefC141Ab74EE65461677087b43F9460a5", //  address offerer; // 0x00
    zone: "0x004C00500000aD104D7DBd00e3ae0A5C00560C00", //  address zone; // 0x20

    //  OfferItem[] offer; // 0x40
    offer: [
      {
        itemType: "", //      ItemType itemType;
        token: "", //      address token;
        identifierOrCriteria: "", //      uint256 identifierOrCriteria;
        startAmount: "", //      uint256 startAmount;
        endAmount: "", //      uint256 endAmount;
      },
    ],

    //  ConsiderationItem[] consideration; // 0x60
    consideration: [
      {
        //      ItemType itemType;
        //      address token;
        //      uint256 identifierOrCriteria;
        //      uint256 startAmount;
        //      uint256 endAmount;
        //      address payable recipient;
      },
    ],

    orderType: "", //  OrderType orderType; // 0x80
    startTime: "", //  uint256 startTime; // 0xa0
    endTime: "", //  uint256 endTime; // 0xc0
    zoneHash: "", //  bytes32 zoneHash; // 0xe0
    salt: "", //  uint256 salt; // 0x100
    conduitKey: "", //  bytes32 conduitKey; // 0x120
    totalOriginalConsiderationItems: "", //  uint256 totalOriginalConsiderationItems; // 0x140

    signature: "", // bytes signature;
  };

  await kicker.kickNFT(order);
  console.log("nft is kicked");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
