const fs = require("fs");

function getCandles(from, to, symbol) {
	return new Promise(next => {
		require("request").get("https://www.bitmex.com/api/udf/history?symbol=" + symbol + "&resolution=5&from=" + from + "&to=" + to, (err, response, data) => {
			if (err) throw err;
			data = JSON.parse(data);
			next(data.o.map((_, i) => ({
				l: data.l[i],
				h: data.h[i],
				o: data.o[i],
				c: data.c[i],
				v: data.v[i]
			})));
		});
	});
}

(async function main() {
	let res = [];
	let date = Math.floor(+new Date() / 1000);
	let months = parseInt(process.argv[2] || 6);
	let symbol = process.argv[3] || "XBTUSD";
	console.log("Getting " + months + " months for '" + symbol + "'");
	for (let i = months; i >= 1; i--) {
		let c = await getCandles(date-60*60*24*30*i, date-60*60*24*30*(i-1), symbol);
		console.log(i);
		res = res.concat(c);
	}
	console.log(res.length);
	fs.writeFileSync("candles", JSON.stringify(res));
})();
