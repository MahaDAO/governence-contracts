import * as fs from "fs";

import { ethers } from "hardhat";

import { DEPLOYED_VOTING_ESCROW } from "./config";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}.`);

  const { provider } = ethers;
  const estimateGasPrice = await provider.getGasPrice();
  const gasPrice = estimateGasPrice.mul(3).div(2);
  console.log(`Gas Price: ${ethers.utils.formatUnits(gasPrice, `gwei`)} gwei`);

  // Need to get a list of unique addresses from block explorer.
  const uniqueUsersData: {
    [name: number | string]: string;
  } = require("../output/uniqueExistingUsers.json");
  const uniqueUsers: string[] = [...new Set(Object.values(uniqueUsersData))];

  const oldMAHAXInterface = new ethers.utils.Interface(
    JSON.stringify(OLD_MAHAX_ABI)
  );
  const oldMAHAX = new ethers.Contract(
    DEPLOYED_VOTING_ESCROW,
    oldMAHAXInterface,
    deployer
  );

  const snapshotData: { [name: string]: any } = {};
  for (const user of uniqueUsers) {
    console.log(`Fetching snapshot for ${user}`);
    const lockedState = await oldMAHAX.locked(user);
    snapshotData[user] = {
      endTime: lockedState.end.toString(),
      amount: lockedState.amount.toString(),
    };
  }

  fs.writeFileSync(
    `./output/userLockSnapshot.json`,
    JSON.stringify(snapshotData)
  );
}

const OLD_MAHAX_ABI = [
  {
    name: "CommitOwnership",
    inputs: [{ name: "owner", type: "address", indexed: false }],
    anonymous: false,
    type: "event",
  },
  {
    name: "ApplyOwnership",
    inputs: [{ name: "owner", type: "address", indexed: false }],
    anonymous: false,
    type: "event",
  },
  {
    name: "Deposit",
    inputs: [
      { name: "provider", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
      { name: "locktime", type: "uint256", indexed: true },
      { name: "type", type: "int128", indexed: false },
      { name: "ts", type: "uint256", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "Withdraw",
    inputs: [
      { name: "provider", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
      { name: "ts", type: "uint256", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "Supply",
    inputs: [
      { name: "prevSupply", type: "uint256", indexed: false },
      { name: "supply", type: "uint256", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "TriggerFallback",
    inputs: [{ name: "fallbackWithdraw", type: "bool", indexed: false }],
    anonymous: false,
    type: "event",
  },
  {
    name: "Transfer",
    inputs: [
      { name: "sender", type: "address", indexed: true },
      { name: "receiver", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "initialize",
    inputs: [
      { name: "token_addr", type: "address" },
      { name: "_name", type: "string" },
      { name: "_symbol", type: "string" },
      { name: "_version", type: "string" },
    ],
    outputs: [],
    gas: 827148,
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "commit_transfer_ownership",
    inputs: [{ name: "addr", type: "address" }],
    outputs: [],
    gas: 39475,
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "apply_transfer_ownership",
    inputs: [],
    outputs: [],
    gas: 41614,
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "commit_smart_wallet_checker",
    inputs: [{ name: "addr", type: "address" }],
    outputs: [],
    gas: 37635,
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "set_staking_contract",
    inputs: [{ name: "addr", type: "address" }],
    outputs: [],
    gas: 37665,
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "apply_smart_wallet_checker",
    inputs: [],
    outputs: [],
    gas: 39692,
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "change_name_symbol",
    inputs: [
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
    ],
    outputs: [],
    gas: 178988,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "get_last_user_slope",
    inputs: [{ name: "addr", type: "address" }],
    outputs: [{ name: "", type: "int128" }],
    gas: 5091,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "user_point_history__ts",
    inputs: [
      { name: "_addr", type: "address" },
      { name: "_idx", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    gas: 2894,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "locked__end",
    inputs: [{ name: "_addr", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    gas: 2879,
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "checkpoint",
    inputs: [],
    outputs: [],
    gas: 38494399,
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "manual_add_users",
    inputs: [
      { name: "_addrs", type: "address[100]" },
      { name: "_ending_times", type: "uint256[100]" },
      { name: "_amounts", type: "uint256[100]" },
    ],
    outputs: [],
    gas: 7731417630,
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "refresh_users",
    inputs: [{ name: "_addrs", type: "address[100]" }],
    outputs: [],
    gas: 942223,
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "deposit_for",
    inputs: [
      { name: "_addr", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    outputs: [],
    gas: 154675012,
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "create_lock",
    inputs: [
      { name: "_value", type: "uint256" },
      { name: "_unlock_time", type: "uint256" },
    ],
    outputs: [],
    gas: 154680917,
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "increase_amount",
    inputs: [{ name: "_value", type: "uint256" }],
    outputs: [],
    gas: 154673995,
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "increase_unlock_time",
    inputs: [{ name: "_unlock_time", type: "uint256" }],
    outputs: [],
    gas: 154683356,
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "withdraw",
    inputs: [],
    outputs: [],
    gas: 38799964,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "balanceOfWithDecay",
    inputs: [{ name: "addr", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "balanceOfWithDecay",
    inputs: [
      { name: "addr", type: "address" },
      { name: "_t", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "addr", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    gas: 15254,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "balanceOfWithoutDecay",
    inputs: [{ name: "addr", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    gas: 15284,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "balanceOfAt",
    inputs: [
      { name: "addr", type: "address" },
      { name: "_block", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    gas: 824805,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "totalSupply",
    inputs: [{ name: "t", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "totalSupplyAt",
    inputs: [{ name: "_block", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    gas: 1894077,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "DEPOSIT_FOR_TYPE",
    inputs: [],
    outputs: [{ name: "", type: "int128" }],
    gas: 3108,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "CREATE_LOCK_TYPE",
    inputs: [],
    outputs: [{ name: "", type: "int128" }],
    gas: 3138,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "INCREASE_LOCK_AMOUNT",
    inputs: [],
    outputs: [{ name: "", type: "int128" }],
    gas: 3168,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "INCREASE_UNLOCK_TIME",
    inputs: [],
    outputs: [{ name: "", type: "int128" }],
    gas: 3198,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "WEEK",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    gas: 3228,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "MAXTIME",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    gas: 3258,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "MULTIPLIER",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    gas: 3288,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "token",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    gas: 3318,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "supply",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    gas: 3348,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "locked",
    inputs: [{ name: "arg0", type: "address" }],
    outputs: [
      { name: "start", type: "uint256" },
      { name: "amount", type: "int128" },
      { name: "end", type: "uint256" },
    ],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "epoch",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    gas: 3408,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "point_history",
    inputs: [{ name: "arg0", type: "uint256" }],
    outputs: [
      { name: "bias", type: "int128" },
      { name: "slope", type: "int128" },
      { name: "ts", type: "uint256" },
      { name: "blk", type: "uint256" },
    ],
    gas: 10293,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "user_point_history",
    inputs: [
      { name: "arg0", type: "address" },
      { name: "arg1", type: "uint256" },
    ],
    outputs: [
      { name: "bias", type: "int128" },
      { name: "slope", type: "int128" },
      { name: "ts", type: "uint256" },
      { name: "blk", type: "uint256" },
    ],
    gas: 10538,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "user_point_epoch",
    inputs: [{ name: "arg0", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    gas: 3713,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "slope_changes",
    inputs: [{ name: "arg0", type: "uint256" }],
    outputs: [{ name: "", type: "int128" }],
    gas: 3643,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    gas: 13788,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    gas: 11541,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "version",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    gas: 11571,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    gas: 3648,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "totalSupplyWithoutDecay",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    gas: 3678,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "future_smart_wallet_checker",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    gas: 3708,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "smart_wallet_checker",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    gas: 3738,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    gas: 3768,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "future_owner",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    gas: 3798,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "initialized",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
    gas: 3828,
  },
  {
    stateMutability: "view",
    type: "function",
    name: "staking_contract",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    gas: 3858,
  },
];

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
