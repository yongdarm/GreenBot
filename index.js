const Discord = require("discord.js");
const {MessageEmbed} = require("discord.js");
const client = new Discord.Client();

const moment = require("moment");
moment.locale("ko");

const request = require("request");
const cheerio = require("cheerio");
const xml2js = require("xml2js");
const math = require("math-expression-evaluator");

const prefix = process.env.prefix;

function CreateMessageEmbed(setFooter = true) {
    const embed = new MessageEmbed()
        .setColor("GREEN");

    if (setFooter)
        embed.setFooter("Made By green1052#2793", "https://cdn.discordapp.com/avatars/368688044934561792/638749733d2d73f23cf12db43e62d33a.webp?size=256");

    return embed;
}

function SendErrorMessage(message, command, error) {
    const embed = CreateMessageEmbed()
        .setTitle(":warning: 오류!")
        .setDescription(`오류가 발생해 명령어 ${command}이(가) 중단됐습니다. 원인: ${error}`);

    message.channel.send(embed);

    console.log(`오류가 발생해 명령어 ${command}이(가) 중단됐습니다. 원인: ${error}`);
}

function SendNeedSomeArgs(message, command, needArgs) {
    const embed = CreateMessageEmbed()
        .setTitle("인수가 부족합니다.")
        .addField("사용법", `그린아 ${command} ${needArgs}`);

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
                    return resolve(member);
            });
        }).finally(() => {
            reject("유저를 찾지 못했습니다.");
        });
    });
}

function SendNekoImage(message, command) {
    request({
        url: "https://nekos.life/api/v2/img/neko",
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:81.0) Gecko/20100101 Firefox/81.0"
        }
    }, function (error, response, body) {
        if (error)
            return SendErrorMessage(message, command, error);

        const json = JSON.parse(body);

        const embed = CreateMessageEmbed()
            .setImage(json.url);

        message.channel.send(embed);
    });
}

client.login(process.env.token);

client.on("ready", () => {
    console.log(`${client.user.tag}이(가) 가동 됐습니다.`);

    client.user.setActivity("그린아 도움말로 도움말 보기", {
        type: "PLAYING"
    });
});

client.on("message", message => {
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).split(" ");
    const command = args.shift();

    let allArgs = args[0];

    for (let i = 1; i < args.length; i++)
        allArgs += ` ${args[i]}`;

    if (command === "도움말") {
        const embed = CreateMessageEmbed()
            .setTitle(`${client.user.username} 도움말`)
            .setDescription(`사용법: ${prefix}(명령어)\n인수 설명: (필수) [선택]`)
            .addField("도움말", "도움말을 볼 수 있습니다.")
            .addField("핑", "핑을 구할 수 있습니다.")
            .addField("실검", "네이버 실시간 검색어를 볼 수 있습니다.")
            .addField("유저", "유저 정보를 볼 수 있습니다.")
            .addField("서버", `${client.user.username}을(를) 사용하는 서버를 볼 수 있습니다.`)
            .addField("초대", `${client.user.username} 초대 링크를 볼 수 있습니다.`)
            .addField("업타임", `${client.user.username}의 작동 시간을 볼 수 있습니다.`)
            .addField("한강", "한강 물 온도를 볼 수 있습니다.")
            .addField("날씨", "날씨를 볼 수 있습니다.")
            .addField("계산", "간단한 계산을 할 수 있습니다. [사용법](https://bugwheels94.github.io/math-expression-evaluator/#supported-maths-symbols)")
            .addField("네코", "귀여운 고양이 소녀를 볼 수 있습니다.");

        message.channel.send(embed);
    } else if (command === "핑") {
        message.channel.send(CreateMessageEmbed().setTitle(":ping_pong: 핑!")).then(msg => {
            const embed = CreateMessageEmbed()
                .setTitle(":ping_pong: 퐁!")
                .setDescription(`Message Latency: ${msg.createdTimestamp - message.createdTimestamp}ms\nAPI Latency: ${Math.round(client.ws.ping)}ms`);

            msg.edit(embed);
        });
    } else if (command === "실검") {
        request({
            url: "https://datalab.naver.com/keyword/realtimeList.naver?age=all&where=main",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:81.0) Gecko/20100101 Firefox/81.0"
            }
        }, function (error, response, body) {
            if (error)
                return SendErrorMessage(message, command, error);

            const $ = cheerio.load(body);

            const embed = CreateMessageEmbed()
                .setAuthor("네이버 실시간 검색어 (1위 ~ 10위)", "https://www.naver.com/favicon.ico")
                .setDescription(`${$(".date_txt").text()} ${$(".time_txt").text()} 기준`);

            $("ul.ranking_list:nth-child(1) span.item_title").each(function (v, k) {
                const word = $(k).text();
                embed.addField(`${v + 1}위`, `[${word}](https://search.naver.com/search.naver?sm=top_hty&fbm=1&ie=utf8&query=${encodeURI(word)})`, true);
            });

            message.channel.send(embed);
        });
    } else if (command === "유저") {
        if (!args[0])
            return SendNeedSomeArgs(message, command, "(멘션 | ID | 이름)");

        GetDiscordUser(message, allArgs).then(data => {
            const member = message.guild.member(data);

            const embed = CreateMessageEmbed()
                .setThumbnail(member.user.avatarURL())
                .setTitle(`${member.user.tag}님의 유저 정보`)
                .addField("멘션", member, true)
                .addField("ID", member.id, true)
                .addField("별명", member.nickname === null ? "없음" : member.nickname, true)
                .addField("봇 유무", member.user.bot, true)
                .addField("역할", member.roles.cache.map(role => role).join("\n"), true)
                .addField("상태", member.presence.status, true)
                .addField("서버 접속 일", moment.utc(member.joinedAt).format("YYYY년 MM월 DD일"), true)
                .addField("계정 생성 일", moment.utc(member.createdAt).format("YYYY년 MM월 DD일"), true)
                .addField("게임 활동", member.presence.activities.length === 0 ? "없음" : member.presence.activities.map(presence => presence.name).join("\n"), true)

            message.channel.send(embed);
        }, function (error) {
            SendErrorMessage(message, command, error);
        });
    } else if (command === "서버") {
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
        request({
            url: "http://hangang.dkserver.wo.tc/",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:81.0) Gecko/20100101 Firefox/81.0"
            }
        }, function (error, response, body) {
            if (error)
                return SendErrorMessage(error);

            const json = JSON.parse(body);

            const embed = CreateMessageEmbed()
                .setTitle(`:man_playing_water_polo: ${moment(json.time).format("YYYY년 MM월 DD일 a hh:mm:ss")} 기준 한강 온도는`)
                .setDescription(`${json.temp}°C 입니다.`)

            message.channel.send(embed);
        });
    } else if (command === "날씨") {
        if (!args[0])
            return SendNeedSomeArgs("(위치)");

        request({
            url: `http://weather.service.msn.com/find.aspx?src=outlook&weadegreetype=C&culture=ko-KR&weasearchstr=${encodeURI(allArgs)}`,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:81.0) Gecko/20100101 Firefox/81.0"
            }
        }, function (error, response, body) {
            if (error)
                return SendErrorMessage(message, command, error);

            xml2js.parseString(body, function (err, result) {
                if (err)
                    return SendErrorMessage(message, command, err);

                const weather = result.weatherdata.weather[0];
                const current = weather.current[0].$;

                const embed = CreateMessageEmbed()
                    .setThumbnail(`${weather.$.imagerelativeurl}law/${current.skycode}.gif`)
                    .setTitle(`${moment(`${current.date} ${current.observationtime}`).format("YYYY년 MM월 DD일 a hh:mm:ss")} 기준 ${current.observationpoint} 날씨`)
                    .addField("현재 날씨", current.skytext, true)
                    .addField("온도", `${current.temperature}°C`, true)
                    .addField("체감 온도", `${current.feelslike}°C`, true)
                    .addField("습도", `${current.humidity}%`, true)
                    .addField("풍속", current.winddisplay, true)
                    .addField("자세히 보기", `[클릭](${weather.$.url})`, true);

                message.channel.send(embed);
            });
        });
    } else if (command === "계산") {
        if (!args[0])
            return SendNeedSomeArgs(message, command, "(식)");

        try {
            const embed = CreateMessageEmbed()
                .setTitle("계산 결과")
                .setDescription(math.eval(allArgs));

            message.channel.send(embed);
        } catch (e) {
            SendErrorMessage(message, command, e.message);
        }
    } else if (command === "네코") {
        if (args[0]) {
            let num = Number(args[0]);

            if (isNaN(num))
                return SendErrorMessage(message, command, "숫자가 아닙니다.");

            if (num > 10)
                return SendErrorMessage(message, command, "최대 10번만 반복할 수 있습니다.");

            for (let i = 0; i < num; i++) {
                SendNekoImage(message, command);
            }

            return;
        }

        SendNekoImage(message, command);
    }
});