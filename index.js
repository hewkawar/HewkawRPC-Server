const DiscordRPC = require('discord-rpc');
const express = require('express');
const cors = require('cors');

const icon = require('./icon.json');
const { version } = require('./package.json');

const app = express();

app.use(cors());
app.use(express.json());

const clientId = '1098619778949726269';

DiscordRPC.register(clientId);

const HewkawRPC = new DiscordRPC.Client({ transport: "ipc" });

const BiliBiliRPC = new DiscordRPC.Client({ transport: "ipc" });

const YoutubeRPC = new DiscordRPC.Client({ transport: "ipc" });

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function clearActivity() {
    HewkawRPC.clearActivity();
    BiliBiliRPC.clearActivity();
    YoutubeRPC.clearActivity();

    return { success: true };
}

function getTimeRatio(currentSecond, maxLength) {
    const maxMinute = Math.floor(maxLength / 60);
    const maxSecond = maxLength % 60;

    const currentMinute = Math.floor(currentSecond / 60);
    const remainingSeconds = currentSecond % 60;

    const ratioString = `${currentMinute}:${remainingSeconds}/${maxMinute}:${maxSecond}`;
    return ratioString;
}

HewkawRPC.on('ready', async () => {
    if (!HewkawRPC) return console.log("Can't connect to Discord");
    console.log(`Hewkaw Presence\nVersion: ${version}`);
    HewkawRPC.setActivity({
        details: "Make By HewkawAr",
        smallImageKey: "me"
    });

    await sleep(3000);

    HewkawRPC.clearActivity()
});

HewkawRPC.login({ clientId }).catch(console.error);

app.get('/', async (req, res) => {
    if (!HewkawRPC) return res.status(500).json({ message: "RPC Server isn't ready!" });
    const userAgent = req.get('User-Agent');

    console.log(`Connected with ${userAgent}`);
    return res.status(200).json({ message: "RPC Server is Ready!", version: version });
});

app.post('/setActivity', async (req, res) => {
    if (!HewkawRPC) return res.status(500).json({ message: "RPC Server isn't ready!" });
    const { status, title, description, lenght, current_second, thumnail_url, url } = req.body;

    if (!status) return res.status(400).json({ message: "Unknow status" });
    if (status == 1) {
        if (!description) return res.status(400).json({ message: "Unknow description" });
    }
    if (!title) return res.status(400).json({ message: "Unknow title" });
    if (!lenght) return res.status(400).json({ message: "Unknow lenght" });
    if (!current_second) return res.status(400).json({ message: "Unknow current_second" });
    if (!thumnail_url) return res.status(400).json({ message: "Unknow thumnail_url" });
    if (!url) return res.status(400).json({ message: "Unknow url" });

    if (status == 1) {
        var RPC = BiliBiliRPC;
        var application = {
            key: "bilibili",
            name: "BiliBili",
            details: `${title} (${description})`,
            url: url,
        };
    } else if (status == 2) {
        var RPC = YoutubeRPC;
        const yt_url = new URL(url);
        yt_url.searchParams.set('t', current_second);
        var application = {
            key: "youtube",
            name: "Youtube",
            details: `${title}`,
            url: yt_url.toString(),
        };
    }

    if (!RPC) return res.status(500).json({ message: "Can't Create RPC Server" })

    await clearActivity();

    const timeFormatted = getTimeRatio(current_second, lenght);

    RPC.setActivity({
        details: application.details,
        state: timeFormatted,
        largeImageKey: thumnail_url,
        largeImageText: title,
        smallImageKey: application.key,
        smallImageText: application.name,
        buttons: [
            { label: `Watch in ${application.name}`, url: application.url }
        ]
    })

    console.log({
        details: application.details,
        state: timeFormatted,
        largeImageKey: thumnail_url,
        largeImageText: title,
        smallImageKey: application.key,
        smallImageText: application.name,
        buttons: [
            { label: `Watch in ${application.name}`, url: application.url }
        ]
    });

    return res.status(201).json({
        details: application.details,
        state: timeFormatted,
        largeImageKey: thumnail_url,
        largeImageText: title,
        smallImageKey: application.key,
        smallImageText: application.name,
        buttons: [
            { label: `Watch in ${application.name}`, url: application.url }
        ]
    });
});

app.post('/clearActivity', async (req, res) => {
    if (clearActivity()) {
        return res.status(200).json({ message: "Clear Activity Success" })
    } else {
        return res.status(500).json({ message: "Clear Activity Fail" })
    };
})

BiliBiliRPC.login({ clientId: icon.BiliBili });
YoutubeRPC.login({ clientId: icon.Youtube });

app.listen(15050, () => {
    console.log(`Server is running at http://localhost:15050`);
});