import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import * as dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const { data, error } = await supabase
	.from("dusted_users")
	.select("address, cosmos_addr");

// console.log(data);

let new_users = [];
let new_address_list = [];
let address_tracker = {};
const abi = [
	"function multisend(address[] calldata _addresses, uint256 _amount) external payable returns (bool)",
];

for (let i = 0; i < data.length; i++) {
	if (address_tracker[data[i]] != true) {
		address_tracker[data[i].address] = true;
	}
}

// get all bridge TX from gravity chain endpoint
axios.get(process.env.BRIDGE_INFO).then(async function (response) {
	// console.log(response.data);
	for (let i = 0; i < response.data.deposit_events.length; i++) {
		if (address_tracker[response.data.deposit_events[i].sender] == true) {
			continue;
		} else {
			if (
				response.data.deposit_events[i].destination.slice(0, 5) ==
				"canto"
			) {
				let dest = response.data.deposit_events[i].destination;
                let sender_addr = response.data.deposit_events[i].sender;
				let balance = await fetch(
					"https://mainnode.plexnode.org:1317/cosmos/bank/v1beta1/balances/" +
						dest +
						"/by_denom?denom=acanto"
				);
				let balanceData = await balance.json();

				let accountNum = await fetch(
					"https://mainnode.plexnode.org:1317/ethermint/evm/v1/account/" +
						sender_addr
				);
				let accountNumData = await accountNum.json();
				console.log(accountNumData);
                console.log(sender_addr);
                console.log(balanceData.balance.amount.length);
				// conditions users must meet to get dusted
				if (
					balanceData.balance.amount.length < 19 &&
					Number(accountNumData.nonce) <= 2
				) {
					address_tracker[
						response.data.deposit_events[i].sender
					] = true;
					new_users.push({
						address: response.data.deposit_events[i].sender,
						nonce: 0,
						dusted: true,
						cosmos_addr:
							response.data.deposit_events[i].destination,
					});
					new_address_list.push(
						response.data.deposit_events[i].sender
					);
				}
			}
		}
	}

	if (new_address_list.length > 0) {
		console.log(new_address_list.length);
		let amt = new_users.length * 3;
		let amt_str = amt.toString();
		// dust canto here
		const provider = new ethers.providers.JsonRpcProvider(
			process.env.RPC_URL,
			7700
		);
		const signer = new ethers.Wallet(process.env.ETH_PRIVATE_KEY, provider);
		const multisendContract = new ethers.Contract(
			"0x2904c0bb3B2bCFF3cEcCa23008E386aA1ffC707c",
			abi,
			signer
		);
		const send = await multisendContract.multisend(
			new_address_list,
			ethers.utils.parseEther("3.0"),
			{ value: ethers.utils.parseEther(amt_str) }
		);

		if (new_users.length > 1) {
			const { errorInsert } = await supabase
				.from("dusted_users")
				.insert(new_users);
		} else if (new_users.length == 1) {
			const { errorInsert } = await supabase
				.from("dusted_users")
				.insert(new_users[0]);
		}
	}
});
