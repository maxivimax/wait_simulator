#!/usr/bin/env node

if (process.argv.length !== 4) {
  console.error("./server.js <auth token> <webserver base URL>");
  process.exit(1);
}


var url = require("url");
var botgram = require("botgram");
var express = require("express");

var bot = botgram(process.argv[2]);
var server = express();

var gameName = "waitsimulator";
var publicBase = process.argv[3];
var queries = {};


bot.command("help", function (msg, reply, next) {
  reply.text("/game для получения игры)");
});

bot.command("start", "game", function (msg, reply, next) {
  reply.game(gameName);
});

bot.callback(function (query, next) {
  if (query.gameShortName !== gameName) return next();
  queries[query.id] = query;
  query.answer({
    url: url.resolve(publicBase, "/telegramBot/game.html?id=" + query.id)
  });
});

console.log(__dirname)
server.use(express.static(__dirname + '/assets'));

server.get("/telegramBot/game.html", function (req, res, next) {
  if (!Object.hasOwnProperty.call(queries, req.query.id)) return next();
  console.log("Отправка игры на %s...", queries[req.query.id].from.name);
  res.sendFile(__dirname + "/assets/game.html");
});

server.get("/telegramBot/submitScore/:score", function (req, res, next) {
  if (!Object.hasOwnProperty.call(queries, req.query.id)) return next();
  res.send("Счет отправлен");
  var query = queries[req.query.id];
  console.log("Отправка счета %s для «%s».", req.params.score, query.from.name);
  bot.setGameScore(query.from, parseInt(req.params.score), {
    chat: query.message ? query.message.chat : null,
    message: query.message || query.inlineMessageId,
  }, function (err, result) { });
});

server.get("/telegramBot/test.html", function (req, res, next) {
  res.send("<h1>Работает!</h1> <p>Сервер вполне ок робит. Используй <a href=\"" + bot.linkGame(gameName) + "\">эту ссылку</a> для запуска игры.");
});

server.listen(3103, function () {
  bot.ready(function () {
    console.log("Сервер и бот готовы.\nОткройте %s, чтобы убедиться, что сервер доступен.", url.resolve(publicBase, "/telegramBot/test.html"));
    console.log("Чтобы играть, напишите /game или используйте ссылку:\n");
    console.log("  %s\n", bot.linkGame(gameName));
  });
});

module.exports = server;