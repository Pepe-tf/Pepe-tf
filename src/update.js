const path = require("path");
const fetch = require("node-fetch");
const fs = require("fs");

const USER = "Pepe-tf";
const API = `https://api.github.com/users/${USER}`;
const THEME = "tokyonight";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const getJSON = async (url) => {
    // A token lifts the 60 req/hour anonymous limit, which shared CI runners burn through fast.
    const headers = process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    return res.json();
};

const countStars = async () => {
    let total = 0;
    for (let page = 1; ; page++) {
        const data = await getJSON(`${API}/starred?per_page=100&page=${page}`);
        total += data.length;
        if (data.length < 100) return total;
    }
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Terminal window in the same style as assets/banner.svg. `rows` are raw SVG, y relative to the window.
const win = (x, w, h, title, rows) => `
  <g transform="translate(${x} 0)">
    <rect width="${w}" height="${h}" rx="12" fill="#1a1b27"/>
    <path d="M0 12a12 12 0 0 1 12-12h${w - 24}a12 12 0 0 1 12 12v24H0z" fill="#24283b"/>
    <circle cx="24" cy="18" r="6" fill="#f7768e"/><circle cx="46" cy="18" r="6" fill="#e0af68"/><circle cx="68" cy="18" r="6" fill="#9ece6a"/>
    <text x="${w / 2}" y="23" text-anchor="middle" font-size="13" fill="#565f89">${esc(title)}</text>${rows}
  </g>`;

const svg = (w, h, body) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="14">${body}\n</svg>\n`;

const kv = (pairs) =>
    pairs
        .map(([k, v], i) => `\n    <text x="24" y="${68 + i * 26}"><tspan fill="#7aa2f7">${esc(k.padEnd(10))}</tspan><tspan fill="#565f89">: </tspan><tspan fill="#c0caf5">${esc(v)}</tspan></text>`)
        .join("");

const writeAsset = (name, content) => fs.writeFileSync(path.join(__dirname, "..", "assets", name), content);

const ordinal = (n) => n + (n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th");

const main = async () => {
    const date = new Date();
    const dd = date.getDate();
    const mm = date.getMonth() + 1;
    const birthday = mm === 9 && dd === 29;
    const flair = mm === 12 ? "❄" : birthday ? "🎉" : "✨";

    const [user, stars, repos] = await Promise.all([
        getJSON(API),
        countStars(),
        getJSON(`${API}/repos?type=owner&per_page=100`),
    ]);

    const earned = repos.reduce((n, r) => n + r.stargazers_count, 0);
    const H = (rows) => 66 + rows * 26; // last baseline + bottom padding
    const info = svg(
        800,
        H(6),
        win(0, 500, H(6), "pepe-tf@earth: ~ whoami", kv([
            ["name", "Pepe-tf aka Bill_Hub"],
            ["role", "web apps + games dev"],
            ["lang", "JavaScript / TypeScript"],
            ["region", "SW, TH, US, JP"],
            ["tools", "NotePad, NotePad++"],
            ["status", "coding is killing me"],
        ])) +
            win(516, 284, H(6), "live.json", kv([
                ["repos", user.public_repos],
                ["followers", user.followers],
                ["starred", stars],
                ["stars", earned],
                ["since", new Date(user.created_at).getFullYear()],
            ])),
    );

    const counts = {};
    for (const r of repos) if (!r.fork && r.language) counts[r.language] = (counts[r.language] || 0) + 1;
    const langs = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const colors = ["#7aa2f7", "#bb9af7", "#9ece6a", "#e0af68", "#f7768e", "#7dcfff"];
    const max = langs[0] ? langs[0][1] : 1;
    const bars = langs
        .map(([name, n], i) => {
            const y = 68 + i * 26;
            return `\n    <text x="24" y="${y}" fill="#c0caf5">${esc(name)}</text><rect x="150" y="${y - 12}" width="${Math.round((n / max) * 520)}" height="14" rx="3" fill="${colors[i]}"/><text x="${150 + Math.round((n / max) * 520) + 10}" y="${y}" fill="#565f89">${n}</text>`;
        })
        .join("");
    const langSvg = svg(800, 68 + langs.length * 26 + 8, win(0, 800, 68 + langs.length * 26 + 8, "~/repos: languages", bars));

    fs.mkdirSync(path.join(__dirname, "..", "assets"), { recursive: true });

    // GitHub strips inline CSS, so the circle is an SVG clip with the photo embedded (SVGs in <img> can't load external images).
    const avatarRes = await fetch(`${user.avatar_url}${user.avatar_url.includes("?") ? "&" : "?"}s=280`);
    if (!avatarRes.ok) throw new Error(`avatar -> ${avatarRes.status}`);
    const avatarB64 = (await avatarRes.buffer()).toString("base64");
    writeAsset(
        "avatar.svg",
        `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="140" height="140" viewBox="0 0 140 140">
  <defs><clipPath id="c"><circle cx="70" cy="70" r="66"/></clipPath></defs>
  <image href="data:image/png;base64,${avatarB64}" xlink:href="data:image/png;base64,${avatarB64}" width="140" height="140" clip-path="url(#c)" preserveAspectRatio="xMidYMid slice"/>
  <circle cx="70" cy="70" r="66" fill="none" stroke="#7aa2f7" stroke-width="3"/>
</svg>
`,
    );
    writeAsset("info.svg", info);
    writeAsset("langs.svg", langSvg);

    // Art and screenshots live on the Janky Dev site (Janky-Frontend/public), so they are linked, not copied.
    const SITE = "https://janky.fpp.wtf";
    const plugins = [
        {
            name: "FakePlayerPlugin 2.0",
            art: "fpp-2-0",
            blurb: "The rewrite nobody asked for but everybody needed. Same idea as Origin, planned this time instead of improvised. Better pathing, better performance, doesn't fall over if two fake players exist at once.",
            tags: ["npc", "testing", "paper", "purpur", "folia"],
            shots: [["pve-mob-farms", "PvE mob farms"], ["find-and-mine", "Find and mine"], ["bot-rental", "Bot rental"]],
            links: [["Modrinth", "https://modrinth.com/plugin/fake-player-plugin-fpp", "modrinth", "1bd96a"], ["Site", `${SITE}/plugins/fakeplayerplugin-2-0`, "googlechrome", "7aa2f7"]],
            repo: "Fake-Player-plugin-2.0",
        },
        {
            name: "FakePlayerPlugin Origin",
            art: "fpp-origin",
            blurb: "The original fake-player spawner. Built in a weekend, held together by hope and a few try/catch blocks we're not proud of. Still running because nobody wants to be the one who breaks it.",
            tags: ["npc", "testing", "pvp", "pathfinding"],
            shots: [["pathfinding-walk-doors-parkour", "Pathfinding"], ["group-pvp", "Group PvP"], ["difficulty-tiers", "Difficulty tiers"]],
            links: [["Site", `${SITE}/plugins/fakeplayerplugin-origin`, "googlechrome", "7aa2f7"]],
        },
        {
            name: "Scripted SMP Core",
            art: "ssmp-core",
            blurb: "The plugin nobody sees but everything depends on. The backbone of our SMP server: teams, nicknames, proximity chat, death tracking, recording mode and admin tools in one place.",
            tags: ["core", "smp", "utility"],
            shots: [["teams-glow", "Teams"], ["proximity-chat", "Proximity chat"], ["recording-mode", "Recording mode"]],
            links: [["BuiltByBit", "https://builtbybit.com/resources/scripted-smp-core.112306/", "googlechrome", "e0af68"], ["Site", `${SITE}/plugins/scripted-smp-core`, "googlechrome", "7aa2f7"]],
            repo: "Scripted-SMP-Core-Public",
        },
    ];
    const badge = (label, color, logo) =>
        `<img src="https://img.shields.io/badge/-${encodeURIComponent(label).replace(/-/g, "--")}-1a1b27?style=for-the-badge${logo ? `&logo=${logo}&logoColor=${color}` : ""}" alt="${label}" />`;
    const pluginCards = plugins
        .map((pl) => {
            const page = pl.links[pl.links.length - 1][1];
            const meta = pl.repo
                ? `\n<img src="https://img.shields.io/github/stars/${USER}/${pl.repo}?style=flat-square&labelColor=1a1b27&color=e0af68" /> <img src="https://img.shields.io/github/last-commit/${USER}/${pl.repo}?style=flat-square&labelColor=1a1b27&color=7aa2f7" />`
                : "";
            return `### ${pl.name}

<a href="${page}"><img src="${SITE}/assets/plugins/${pl.art}-banner-2000x400.png" alt="${pl.name}" width="100%" /></a>

${pl.blurb}

${pl.tags.map((t) => `<code>${t}</code>`).join(" ")}${meta}

<table><tr>
${pl.shots.map(([f, alt]) => `<td width="33%"><img src="${SITE}/media/${pl.art}/${f}.webp" alt="${alt}" /><br /><sub>${alt}</sub></td>`).join("\n")}
</tr></table>

${pl.links.map(([label, url, logo, color]) => `<a href="${url}">${badge(label, color, logo)}</a>`).join(" ")}`;
        })
        .join("\n\n---\n\n");

    const text = `<div align="center">

<img src="assets/avatar.svg" alt="Pepe-tf" width="140" />

<img src="assets/banner.svg" alt="Pepe-tf" width="100%" />

**a developer from somewhere on earth** ${flair}

![Followers](https://img.shields.io/github/followers/${USER}?style=for-the-badge&labelColor=1a1b27&color=7aa2f7)
![Stars](https://img.shields.io/badge/starred-${stars}-bb9af7?style=for-the-badge&labelColor=1a1b27)
![Earned](https://img.shields.io/badge/stars%20earned-${earned}-e0af68?style=for-the-badge&labelColor=1a1b27)

</div>

<img src="assets/info.svg" alt="whoami" width="100%" />

<p align="center">
<a href="#-plugins">plugins</a> · <a href="#-stack">stack</a> · <a href="#-languages">languages</a> · <a href="#-stats">stats</a> · <a href="#-find-me">find me</a>
</p>

## 🔌 Plugins

${pluginCards}

## 🛠 Stack

<p align="center">
<img src="https://img.shields.io/badge/-Java-1a1b27?style=for-the-badge&logo=openjdk&logoColor=f89820" />
<img src="https://img.shields.io/badge/-JavaScript-1a1b27?style=for-the-badge&logo=javascript&logoColor=f7df1e" />
<img src="https://img.shields.io/badge/-TypeScript-1a1b27?style=for-the-badge&logo=typescript&logoColor=3178c6" />
<img src="https://img.shields.io/badge/-Node.js-1a1b27?style=for-the-badge&logo=nodedotjs&logoColor=5fa04e" />
<img src="https://img.shields.io/badge/-Python-1a1b27?style=for-the-badge&logo=python&logoColor=3776ab" />
<img src="https://img.shields.io/badge/-HTML5-1a1b27?style=for-the-badge&logo=html5&logoColor=e34f26" />
<img src="https://img.shields.io/badge/-CSS3-1a1b27?style=for-the-badge&logo=css3&logoColor=1572b6" />
<img src="https://img.shields.io/badge/-Git-1a1b27?style=for-the-badge&logo=git&logoColor=f05032" />
<img src="https://img.shields.io/badge/-Paper-1a1b27?style=for-the-badge&logo=papermc&logoColor=white" />
</p>

## 📊 Languages

<img src="assets/langs.svg" alt="top languages" width="100%" />

## 📈 Stats

<div align="center">

<img src="https://streak-stats.demolab.com/?user=${USER}&theme=${THEME}" />
<br />
<img src="https://github-readme-stats.vercel.app/api?username=${USER}&theme=${THEME}&count_private=true&show_icons=true&include_all_commits=true" />

</div>

## 🔗 Find me

<p align="center">
<a href="https://github.com/${USER}"><img src="https://img.shields.io/badge/-@${USER.replace("-", "--")}-1a1b27?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" /></a>
<a href="https://janky.fpp.wtf"><img src="https://img.shields.io/badge/-Janky%20Dev-1a1b27?style=for-the-badge&logo=googlechrome&logoColor=7aa2f7" alt="Janky Dev" /></a>
<a href="https://discord.gg/pzFQWA4TXq"><img src="https://img.shields.io/badge/-Discord-1a1b27?style=for-the-badge&logo=discord&logoColor=5865F2" alt="Discord" /></a>
</p>

<div align="center">

<!-- Last updated on ${date.toString()} ;-;-->
<sub>last updated ${ordinal(dd)} ${MONTHS[date.getMonth()]} ${date.getFullYear()} using magic${birthday ? " · and... today is my birthday 🎂" : ""}</sub>

</div>
`;

    fs.writeFileSync(path.join(__dirname, "..", "README.md"), text);
};

main().catch((err) => {
    // Fail loudly and leave the existing README untouched.
    console.error(err);
    process.exit(1);
});
