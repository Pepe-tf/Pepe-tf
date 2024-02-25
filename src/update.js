const path = require("path");
const fetch = require("node-fetch");
const fs = require("fs");

let stars = 0,
    page = 1;

let special;

const CountStars = async () => {
    let StarsData = await fetch(`https://api.github.com/users/Pepe-tf/starred?per_page=100&page=${page}`).then((res) => res.json());
    stars += StarsData.length;
    page++;
    if (StarsData.length === 100) CountStars();
    else WriteReadMe();
};

const WriteReadMe = async () => {
    //Get ReadMe path
    const ReadMe = path.join(__dirname, "..", "README.md");
    const date = new Date();

    //Season Based Emoji
    let dd = date.getDate(),
        mm = date.getMonth() + 1;

    if (mm === 12) special = ["⛄", "❄", "🎄"];
    else if (mm === 9 && dd === 29) special = ["🎉", "🎈", "🎊"];

    //Fetching Info From Github API
    let UserData = await fetch("https://api.github.com/users/Pepe-tf").then((res) => res.json());

    //Creating the text what we gonna save on ReadMe file
    const text = `## Hi there 👋 <img align="right" style="border: 2px solid red; border-radius: 12px;" src="https://cdn.discordapp.com/avatars/640512148786642947/bc5d72c0543cc2dd0a5b2ec1c869d285.png" width="180" />
  I'm **Pepe-tf** aka **Bill_Hub**, An developer from somewhere in the earth. I like to code web applications and games. I have worked on many projects in my past. Thanks for visiting my github profile. Have a great day ahead!~
  
  <h2 align="center">✨ About Me ✨</h2>
  
  \`\`\`js
  const Pepe_tf = {
    FavouriteLanguage: "JavaScript/TypeScript",
    UserName: "Bill_Hub" || "Pepe_tf",
    Age: null,
    Height: null,
    Country: "Sweden",
    Tools: {
      VsCode: true,
      NotePad: true
    }
  }; //Coding is killing me.
  
\`\`\`
  
  <h2 align="center">💬 Contact Me 💬</h2>
  
  [![Discord Presence](https://lanyard.cnrad.dev/api/640512148786642947)](https://discord.com/users/640512148786642947)
  
  <h2 align="center">🚀 My Stats 🚀</h2>
  <p align="center">
      <img src="https://github-readme-streak-stats.herokuapp.com/?user=Pepe-tf&theme=tokyonight" />
  </p>
  <details>
      <summary>
          Even more stats
      </summary>
      <br />
      <p align="center">
          <img src="https://github-profile-trophy.vercel.app/?username=Pepe-tf&theme=dracula" />
      </p>
      <p align="center">
          <img src="https://github-readme-stats.vercel.app/api?username=Pepe-tf&theme=tokyonight&count_private=true&show_icons=true&include_all_commits=true" />
      </p>
      <p align="center">
          <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=stuyy&layout=compact&theme=dark" />
      </p>
  </details>
  
  <!-- Last updated on ${date.toString()} ;-;-->
  <i>Last updated on ${date.getDate()}${date.getDate() === 1 ? "st" : date.getDate() === 2 ? "nd" : date.getDate() === 3 ? "rd" : "th"} ${
        ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][date.getMonth()]
    } ${date.getFullYear()} using magic</i> ${special ? special[2] : "✨"} ${mm === 9 && dd === 29 ? "and... today is my birthday" : ""}`;

    //Saving on readme.md
    fs.writeFileSync(ReadMe, text);
};

(() => {
    CountStars();
})();
