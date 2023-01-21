# Unreal Discord Bot Verification

An automatic verification bot for Unreal Marketplace Asset Creators

## What is this ?

It's a NodeJS Script made quickly and need a little bit of cleaning, to allow asset creators on the marketplace to automate securely the verification and role assignation for Asset verification.
It works by using scanning all Discord usernames inside the list of the review in the marketplace review page and comparing it to the one who talks to the bot.

If the user is in the list, it will assign the role to the user and register the verification inside a local database to ensure another layer of security.

This database will contain the Discord name, Discord Unique Id, Epic Id, Epic message Content to secure the changes of the Discord name inside the review page like so :

```json
{
  "verifiedUsers": [
    {
      "discord": "Discord#0000",
      "discord_id": "12345678912345678",
      "url_plugin": "plugin_url",
      "epicId": "aaaaaaaaaaaaaaaaaaaaaaaa",
      "originalContent": "review content"
    }
  ],
  "warning": [
    {
      "discord": "Discord#0001",
      "discord_id": "12345678912345679",
      "url_plugin": "plugin_url",
      "reason": "Already verified",
      "epicId": "N/A",
      "newContent": "N/A",
      "databaseContent": "N/A"
    },
    {
      "discord": "Discord#0002",
      "discord_id": "12345678912345680",
      "url_plugin": "plugin_url",
      "reason": "No review found with Discord Id of user",
      "epicId": "N/A",
      "newContent": "N/A",
      "databaseContent": "N/A"
    }
  ]
}
```

To ensure a maximum security, the entire post is saved once registered, with the Epic Id to ensure that the user don't change the discord name in the review to allow another user to get the verification.

If they try, they will be registered inside the Warning array of the database.

## How to use it ?

Create a Discord Bot by following the official documentation : https://discord.com/developers/docs/intro

Then, take the script and run "npm install"

Change the configuration inside the "config.json" file like so :

```json
{
  "token": "Discord Bot Token",
  "pluginList": [
    {
      "plugin": "plugin_url", 
      "url": "api review list url",
      "role": "role name once verified"
    },
    { ... },
    { ... },
    { ... },
    { ... },
  ]
}
```

Then, execute node ./src/index.js to launch the bot

Note : You need to get the exact same name on the discord Server for the roles or it will not work.

This is still an alpha but in terms of functionnality, it's working.

## How to interact with the bot to get verified ?

Once you posted you Discord Id inside the review page of the plugin, just chat in private with the bot, by sending the exact url of the plugin you want to get verified for.

It will do the rest automatically.