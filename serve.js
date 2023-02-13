import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import * as dotenv from 'dotenv'

dotenv.config()
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const { data, error } = await supabase
	.from("dusted_users")
	.select("address, cosmos_addr");

// console.log(data);

let new_users = [];
let address_tracker = {};

for (let i = 0; i < data.length; i++) {
	if (address_tracker[data[i]] != true) {
		address_tracker[data[i].address] = true;
	}
}

// get all bridge TX from gravity chain endpoint
axios
	.get(process.env.BRIDGE_INFO)
	.then(async function (response) {
		// console.log(response.data);
		for (let i = 0; i < response.data.deposit_events.length; i++) {
			if (address_tracker[response.data.deposit_events[i].sender] == true) {
				continue;
			} else {
				if (
					response.data.deposit_events[i].destination.slice(0, 5) ==
					"canto"
				) {
					if (
						address_tracker[
							response.data.deposit_events[i].sender
						] != true
					) {
                        // dust canto here
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
					}
				}
			}
		}
		if (new_users.length > 1) {
			const { errorInsert } = await supabase
				.from("dusted_users")
				.insert(new_users);
		} else if (new_users.length== 1) {
            const { errorInsert } = await supabase
				.from("dusted_users")
				.insert(new_users[0]);
        }
	});
