## Overview
dbotV2 is a core component of canto dusting infrastructure. This bot dusts canto to new users who have bridged assets into canto via [gravity bridge](https://github.com/Gravity-Bridge/Gravity-Bridge). 

## Installation
`yarn install`

## Usage
1. create `.env` file with following variables
    ```bash
    # Environment variables.
    SUPABASE_KEY="<KEY>"
    SUPABASE_URL="<URL>"
    BRIDGE_INFO="<BRIDGE_INFO_ENDPOINT>"
    ```
2. run `node serve.js`

## TODO
- change everything to typescript. JS is pain and I only made this because I had similar code from years ago...
- add multi-send contract to this repo
- clean up structure of code; current version is just mvp
