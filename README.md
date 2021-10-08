# Freyala (XYA) Discord Bot

![GitHub tag (latest SemVer)](https://img.shields.io/github/v/tag/Freyala-Crypto/tipbot.svg?label=version) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Requirements

- [Node.js](http://nodejs.org/) (>=12.0.0)
- MariaDB
- [Discord](https://discordapp.com/) account

## Installation

### Create a discord bot

Visit the [Discord developers page](https://discord.com/developers) and create a new bot. Instructions on how to make a Discord bot can be found [here](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot)

### Install the project

Clone this repo on your server

```shell
git clone git@github.com:Freyala-Crypto/tipbot.git
```

Install the node dependencies

```shell
npm i
```

And finally copy `.env.example` to `.env`

```shell
cp .env.example .env
```

### Artifact

Replace `artifact.json` with your contract abi JSON

### Configure dotenv

Update the `.env` values. These tables explain what variable is used for what

#### Discord

Key | Type | Example | Description
--- | --- | --- | ---
TOKEN | string | LKDJI98789dhs8KJNK...JH87JHguIYbBJy-DKkd8db | This is the bot's Discord token. See [this section](###Create-a-discord-bot) on how to get it
BOT_WALLET_ADDRESS | string | 0x89y92...38jhu283h9 | This is the address of an externally created wallet. This wallet is used to send gas from
BOT_WALLET_PRIVATE_KEY | string | 934ccbaec7...45980bf2dae |This is the private key of an externally created wallet

#### Database

Key | Type | Example | Description
--- | --- | --- | ---
DB_HOST | string | localhost
DB_DIALECT | string | mariadb
DB_USER | string | root
DB_PASSWORD | string | |
DB_NAME | string | xya_bot

#### Cypher

Key | Type | Example | Description
--- | --- | --- | ---
CYPHER_SECRET | string | !%hX!*i!C8ojryAzPWv*0@ | A password used to encrypt all personal data

### Config

The general non-sensitive or environment specific data is stored in `config/default.yml`. These tables explain what variable is used for what

#### General

Key | Type | Example | Description
--- | --- | --- | ---
prefix | string | "!f" | The prefix used before all commands
error_reporting_users | string | "@Gydo or @Tailchakra" | Text explaining which users to contact for support
owner_ids | array | - 123456789012345<br> - 123456789012345 | Not in use at the moment but will be used in the future for permissions on restricted commands
blacklist | array | - 123456789012345<br> - 123456789012345 | Any user ID listed in this array wont be able to use the bot and will receive a notification every time he/she tries
cooldown | integer | 20000 | Cooldown period in milliseconds

#### Token

Key | Type | Example | Description
--- | --- | --- | ---
contract_address | string | "0x9b68BF4bF89c115c721105eaf6BD5164aFcc51E4"
symbol | string | "XYA"
decimals | integer | 18
network_explorer | string | "https://explorer.harmony.one/#"
rpc_url | string | "https://ams-hmy-rpc.freyala.com"
viper_pair_id | string | "0x1485a496f816f940c510d634e48f8c66b78dc99e"

#### Price embed

Key | Type | Example | Description
--- | --- | --- | ---
title | string | "Freyala | XYA"
thumbnail | string | "https://freyala.com/_nuxt/icons/icon_64x64.5f6a36.png"
chart_link | string | "https://www.freyala.com/chart"
url | string | "https://www.freyala.com/chart"
footer | string | "Source: Viperswap"

### Colors

Key | Type | Example | Description
--- | --- | --- | ---
primary | string | "#7FCA49"
info | string | "#0EA5E9"
error | string | "#FF0000"

#### Sea creatures

Key | Type | Example | Description
--- | --- | --- | ---
sea_creatures.[creature name].low | integer | 10 
sea_creatures.[creature name].high | integer | 50

### Start the bot

After the configuration you are ready to start the bot.

#### Node command

The simplest way of starting the bot is using the `node` command

```shell
node bot.js
```

To prevent the bot from going offline you can start the node in a screen

```shell
screen -S Bot
node bot.js
```

Followed by `ctrl` + `a` `ctrl` + `d` to detach the screen.

To open the screen again

```shell
screen -r Bot
```

#### Alternatives

Alternatively if you want auto reload when files are updated, monitoring etc you can use one of these packages

##### Nodemon

[Nodemon website](https://nodemon.io/)

```shell
screen -S Bot
nodemon bot.js
```

##### PM2

[PM2 website](https://pm2.keymetrics.io/)

```shell
pm2 start bot.js --name Bot --watch
```

## Roadmap

Visit the [GitHub project](https://github.com/orgs/freyala/projects/1) for the roadmap

## License

MIT License

Copyright (c) 2021 Gydo Makkinga Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
