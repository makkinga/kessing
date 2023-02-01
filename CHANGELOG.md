# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] dd-mm-yyyy

### Added

- Bank contract. Kessing no longer keeps any wallet data and tokens can be deposited using MetaMask
- A new way to create and manage your account was added in the form of a web page
- The code was updated to DiscordJS v14 and the Discord API v10
- The information in `/help` has moved to GitBook
- CRYSTAL was added as a tippable token
- The long awaited and most requested `/snow` command has arrived!
- A new `/statistics` command had been added inlcuding charts for individual tokens
- The "Kessing's Mancave" Discord server is now accessable to the public. This is the new place for support, bug reporting, and feature requests

### Removed

- The `/get-gas` command was removed, gas will now be provided by DFK
- `/convert`-address was removed for obvious reasons
- All "send" commands have been removed. Tokens can now be withdrawn from the contract from the account website
- The `/pkey` command was removed, Kessing has no clue what your pkey is
- Tip`/burn` statistics have been removed