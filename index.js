const Discord = require("discord.js");
const client = new Discord.Client();

const moment = require("moment");
moment.locale("ko");

const cheerio = require("cheerio");
const xml2js = require("xml2js");
const math = require("math-expression-evaluator");
const axios = require("axios");

const prefix = process.env.prefix;

function CreateMessageEmbed() {
    return new Discord.MessageEmbed()
        .setColor("GREEN")
        .setFooter("Made By green1052#2793", "https://cdn.discordapp.com/avatars/368688044934561792/638749733d2d73f23cf12db43e62d33a.webp?size=256");
}

function SendErrorMessage(message, command, error) {
    const embed = CreateMessageEmbed()
        .setTitle(":warning: 오류!")
        .setDescription(`오류가 발생해 명령어 ${command}이(가) 중단됐습니다. 사유: ${error}`);

    message.channel.send(embed);

    console.log(`오류가 발생해 명령어 ${command}이(가) 중단됐습니다. 사유: ${error}`);
}

function SendNeedSomeArgs(message, command, needArgs) {
    const embed = CreateMessageEmbed()
        .setTitle("인수가 부족합니다.")
        .addField("사용법", `${prefix}${command} ${needArgs}`);

    message.channel.send(embed);
}

function GetDiscordUser(message, allArgs) {
    return new Promise(function (resolve, reject) {
        if (message.mentions.users.first())
            return resolve(message.mentions.users.first());

        const tempAllArgs = allArgs.toLowerCase();

        message.guild.members.fetch().then(members => {
            members.forEach(member => {
                if (member.user.id.includes(tempAllArgs) || member.user.username.toLowerCase().includes(tempAllArgs) || member.nickname !== null && member.nickname.toLowerCase().includes(tempAllArgs))
                    return resolve(message.guild.member(member));
            });
        }).finally(() => {
            reject("유저를 찾지 못했습니다.");
        });
    });
}

function SendNekoImage(message, command) {
    axios.get("https://nekos.life/api/v2/img/neko", {headers: {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:81.0) Gecko/20100101 Firefox/81.0"}}).then(response => {
        const embed = CreateMessageEmbed()
            .setImage(response.data.url);

        message.channel.send(embed);
    }).catch(function (e) {
        SendErrorMessage(message, command, e.message);
    });
}

function GetQuoteInContent(content) {
    let contents = [];

    let open = false;
    let string = "";

    for (const i in content) {
        if (content[i] === '"')
            open = !open;

        if (open && content[i] !== '"')
            string += content[i];

        else if (string !== "") {
            contents.push(string);
            string = "";
        }
    }

    if (open)
        return null;

    return contents;
}

client.login(process.env.token);

client.on("ready", () => {
    console.log(`${client.user.tag}이(가) 가동됐습니다.`);

    client.user.setActivity(`${prefix}도움말로 도움말 보기`, {
        type: "PLAYING"
    });
});

client.on("message", message => {
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift();

    let allArgs = args[0];

    for (let i = 1; i < args.length; i++)
        allArgs += ` ${args[i]}`;

    if (command === "도움말") {
        const embed = CreateMessageEmbed()
            .setTitle(`${client.user.username} 도움말`)
            .setDescription(`예시: ${prefix}(명령어) (필수) [선택]`)
            .addField("도움말", "도움말을 볼 수 있습니다.")
            .addField("핑", "핑을 구할 수 있습니다.")
            .addField("실검", "네이버 실시간 검색어를 볼 수 있습니다.")
            .addField("유저 (멘션 | ID | 이름)", "유저 정보를 볼 수 있습니다.")
            .addField("사용", `${client.user.username}을(를) 사용하는 서버를 볼 수 있습니다.`)
            .addField("초대", `${client.user.username} 초대 링크를 볼 수 있습니다.`)
            .addField("업타임", `${client.user.username}의 작동 시간을 볼 수 있습니다.`)
            .addField("한강", "한강 물 온도를 볼 수 있습니다.")
            .addField("날씨 (지역)", "날씨를 볼 수 있습니다.")
            .addField("계산 (식)", "간단한 계산을 할 수 있습니다. [사용법](https://bugwheels94.github.io/math-expression-evaluator/#supported-maths-symbols)")
            .addField("네코 [반복]", "귀여운 고양이 소녀를 볼 수 있습니다.")
            .addField(`골라 ("내용")`, "여러 단어 중 한개를 무작위로 골라줍니다.")
            .addField(`추방 "(멘션 | ID | 이름)" "[사유]"`, "유저를 서버에서 추방할 수 있습니다.")
            .addField(`밴 "(멘션 | ID | 이름)" "[사유]"`, "유저를 서버에서 밴할 수 있습니다.")
            .addField("청소 (수)", "메시지를 자울 수 있습니다.");

        message.channel.send(embed);
    } else if (command === "핑") {
        message.channel.send(CreateMessageEmbed().setTitle(":ping_pong: 핑!")).then(msg => {
            const embed = CreateMessageEmbed()
                .setTitle(":ping_pong: 퐁!")
                .setDescription(`Message Latency: ${msg.createdTimestamp - message.createdTimestamp}ms\nAPI Latency: ${Math.round(client.ws.ping)}ms`);

            msg.edit(embed);
        });
    } else if (command === "실검") {
        axios.get("https://datalab.naver.com/keyword/realtimeList.naver?age=all&where=main", {headers: {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:81.0) Gecko/20100101 Firefox/81.0"}}).then(response => {
            const $ = cheerio.load(response.data);

            const embed = CreateMessageEmbed()
                .setAuthor("네이버 실시간 검색어 (1위 ~ 20위)", "https://www.naver.com/favicon.ico")
                .setDescription(`${$(".date_txt").text()} ${$(".time_txt").text()} 기준`);

            $("ul.ranking_list span.item_title").each(function (v, k) {
                const word = $(k).text();
                embed.addField(`${v + 1}위`, `[${word}](https://search.naver.com/search.naver?sm=top_hty&fbm=1&ie=utf8&query=${encodeURI(word)})`, true);
            });

            message.channel.send(embed);
        }).catch(function (e) {
            SendErrorMessage(message, command, e.message);
        });
    } else if (command === "유저") {
        if (!args[0])
            return SendNeedSomeArgs(message, command, "(멘션 | ID | 이름)");

        GetDiscordUser(message, allArgs).then(data => {
            const embed = CreateMessageEmbed()
                .setThumbnail(data.user.avatarURL())
                .setTitle(`${data.user.tag}님의 유저 정보`)
                .addField("멘션", data, true)
                .addField("ID", data.id, true)
                .addField("별명", data.nickname === null ? "없음" : data.nickname, true)
                .addField("봇 유무", data.user.bot, true)
                .addField("역할", data.roles.cache.map(role => role).join("\n"), true)
                .addField("상태", data.presence.status, true)
                .addField("서버 접속 일", moment.utc(data.joinedAt).format("LL"), true)
                .addField("계정 생성 일", moment.utc(data.createdAt).format("LL"), true)
                .addField("게임 활동", data.presence.activities.length === 0 ? "없음" : data.presence.activities.map(presence => presence.name).join("\n"), true)

            message.channel.send(embed);
        }, function (error) {
            SendErrorMessage(message, command, error);
        });
    } else if (command === "사용") {
        const embed = CreateMessageEmbed()
            .setTitle(`${client.user.username}을(를) 사용하는 서버 목록`)
            .setDescription(`${client.guilds.cache.size}개의 서버가 봇을 사용하고 있습니다.`);

        client.guilds.cache.forEach(guild => {
            embed.addField(guild.name, `맴버 수: ${guild.memberCount}`, true);
        });

        message.channel.send(embed);
    } else if (command === "초대") {
        const embed = CreateMessageEmbed()
            .setTitle(`${client.user.username} 초대 링크`)
            .setDescription(`[클릭](https://discord.com/oauth2/authorize?scope=bot&client_id=765422745571164178&permissions=8)`);

        message.channel.send(embed);
    } else if (command === "업타임") {
        const upTime = client.uptime;

        const days = Math.floor((upTime / (1000 * 60 * 60 * 24)) % 60);
        const hrs = Math.floor((upTime / (1000 * 60 * 60)) % 60);
        const min = Math.floor((upTime / (1000 * 60)) % 60);
        const sec = Math.floor((upTime / 1000) % 60);

        const embed = CreateMessageEmbed()
            .setTitle(`:construction_worker: ${days}일 ${hrs}시간 ${min}분 ${sec}초 동안 쉬지 않고 작동 했습니다.`)

        message.channel.send(embed);
    } else if (command === "한강") {
        axios.get("http://hangang.dkserver.wo.tc/", {headers: {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:81.0) Gecko/20100101 Firefox/81.0"}}).then(response => {
            const embed = CreateMessageEmbed()
                .setTitle(`:man_playing_water_polo: ${moment(response.data.time).format("LLLL")} 기준 한강 물 온도`)
                .setDescription(`${response.data.temp}°C`)

            message.channel.send(embed);
        }).catch(function (e) {
            SendErrorMessage(message, command, e.message);
        });
    } else if (command === "날씨") {
        if (!args[0])
            return SendNeedSomeArgs(message, command, "(위치)");

        axios.get(`http://weather.service.msn.com/find.aspx?src=outlook&weadegreetype=C&culture=ko-KR&weasearchstr=${encodeURI(allArgs)}`, {headers: {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:81.0) Gecko/20100101 Firefox/81.0"}}).then(response => {
            xml2js.parseString(response.data, function (err, result) {
                if (err)
                    return SendErrorMessage(message, command, err);

                const weather = result.weatherdata.weather[0];
                const current = weather.current[0].$;

                const embed = CreateMessageEmbed()
                    .setThumbnail(`${weather.$.imagerelativeurl}law/${current.skycode}.gif`)
                    .setTitle(`${moment(`${current.date} ${current.observationtime}`).format("LLLL")} 기준 ${current.observationpoint} 날씨`)
                    .addField("현재 날씨", current.skytext, true)
                    .addField("온도", `${current.temperature}°C`, true)
                    .addField("체감 온도", `${current.feelslike}°C`, true)
                    .addField("습도", `${current.humidity}%`, true)
                    .addField("풍속", current.winddisplay, true)
                    .addField("자세히 보기", `[클릭](${weather.$.url})`, true);

                message.channel.send(embed);
            });
        }).catch(function (e) {
            SendErrorMessage(message, command, e.message);
        });
    } else if (command === "계산") {
        if (!args[0])
            return SendNeedSomeArgs(message, command, "(식)");

        try {
            const embed = CreateMessageEmbed()
                .setTitle("결과")
                .setDescription(math.eval(allArgs));

            message.channel.send(embed);
        } catch (e) {
            SendErrorMessage(message, command, e.message);
        }
    } else if (command === "네코") {
        if (args[0]) {
            if (isNaN(args[0]))
                return SendErrorMessage(message, command, "숫자가 아닙니다.");

            if (args[0] > 5)
                return SendErrorMessage(message, command, "최대 5번만 반복할 수 있습니다.");

            for (let i = 0; i < args[0]; i++)
                SendNekoImage(message, command);

            return;
        }

        SendNekoImage(message, command);
    } else if (command === "골라") {
        if (!args[0] || !args[1])
            return SendNeedSomeArgs(message, command, `"(단어)"`);

        const contents = GetQuoteInContent(message.content);

        if (contents === null)
            return SendErrorMessage(message, command, "배열이 잘못됐습니다.");

        const embed = CreateMessageEmbed()
            .setTitle(contents[Math.floor(Math.random() * contents.length)]);

        message.channel.send(embed);
    } else if (command === "추방") {
        if (!message.guild.member(message.author).hasPermission("KICK_MEMBERS"))
            return SendErrorMessage(message, command, "권한이 부족합니다.");

        if (!args[0])
            return SendNeedSomeArgs(message, command, `"(멘션 | ID | 이름)" "[사유]"`);

        const contents = GetQuoteInContent(message.content);

        if (contents === null)
            return SendErrorMessage(message, command, "배열이 잘못됐습니다.");

        GetDiscordUser(message, contents[0]).then(data => {
            data.kick(contents[1]).then(member => {
                const embed = CreateMessageEmbed()
                    .setTitle(`${member.user.tag}을(를) 성공적으로 추방 했습니다.`)
                    .setDescription(`사유: ${contents[1] === null ? contents[1] : "없음"}`);

                message.channel.send(embed);
            }).catch(error => {
                SendErrorMessage(message, command, error);
            });

        }, function (error) {
            SendErrorMessage(message, command, error);
        });
    } else if (command === "밴") {
        if (!message.guild.member(message.author).hasPermission("BAN_MEMBERS"))
            return SendErrorMessage(message, command, "권한이 부족합니다.");

        if (!args[0])
            return SendNeedSomeArgs(message, command, `"(멘션 | ID | 이름)" "[사유]"`);

        const contents = GetQuoteInContent(message.content);

        if (contents === null)
            return SendErrorMessage(message, command, "배열이 잘못됐습니다.");

        GetDiscordUser(message, contents[0]).then(data => {
            data.ban(contents[1]).then(member => {
                const embed = CreateMessageEmbed()
                    .setTitle(`${member.user.tag}을(를) 성공적으로 밴 했습니다.`)
                    .setDescription(`사유: ${contents[1] === null ? contents[1] : "없음"}`);

                message.channel.send(embed);
            }).catch(error => {
                SendErrorMessage(message, command, error);
            });

        }, function (error) {
            SendErrorMessage(message, command, error);
        });
    } else if (command === "청소") {
        if (!args[0])
            return SendNeedSomeArgs(message, command, "(수)");

        if (!message.guild.member(message.author).hasPermission("MANAGE_MESSAGES"))
            return SendErrorMessage(message, command, "권한이 부족합니다.");

        if (isNaN(args[0]))
            return SendErrorMessage(message, command, "숫자가 아닙니다.");

        if (args[0] > 100)
            return SendErrorMessage(message, command, "100 이하의 값을 입력 해주세요");

        message.delete();

        message.channel.bulkDelete(args[0]).then(messages => {
            message.channel.send(CreateMessageEmbed().setTitle("삭제 완료").setDescription(`${messages.size}개의 메시지를 지웠습니다.`))
        }).catch(error => {
            SendErrorMessage(message, command, error);
        });
    }
});